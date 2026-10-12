// The printable reports: the customer's design report, the install sheet and the materials list, laid out as A4 pages
// from the engine's report blocks (ReportText.swift — the app's wording). The browser's print window saves them as PDF.

import * as store from './store.js?v=6d56e6e-202610121204';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DUCT = (mm) => mm <= 150 ? '#E0342F' : mm <= 200 ? '#6A8DDB' : mm <= 250 ? '#F0CB2E' : mm <= 300 ? '#7DC242' : mm <= 350 ? '#BFC4C9' : mm <= 400 ? '#D35FD0' : '#7B3FE4';

/// The duct plan as the reports draw it (rooms by zone, ducts, labels with L/s and m², grilles, the outdoor unit).
function planImage(app, Plan, w, h) {
  const cv = document.createElement('canvas');
  cv.style.cssText = `position:fixed;left:-10000px;top:0;width:${w}px;height:${h}px`;
  document.body.append(cv);
  const plan = new Plan(cv, {});
  plan.set({ project: app.project, view: app.view, layout: app.designLayout ?? app.layout, showPlan: false, interactive: false,
    labels: true, compact: false, report: true, dpr: 2 });
  plan.draw();
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, cv.width, cv.height);
  const url = cv.toDataURL('image/png');
  cv.remove();
  return url;
}

function block(b, ctx) {
  switch (b.type) {
    case 'letterhead':
      return `<div class="letterhead">${ctx.logo ? `<img class="logo" src="${esc(ctx.logo)}" alt="">` : '<div class="logo mark">TT</div>'}
        <div class="who"><b>${esc(b.text)}</b>${(b.lines ?? []).slice(0, -1).map((l) => `<div>${esc(l)}</div>`).join('')}</div>
        <div class="date">${esc((b.lines ?? []).slice(-1)[0] ?? '')}</div></div>`;
    case 'title': return `<h1 class="${esc(b.style ?? '')}">${esc(b.text)}</h1>`;
    case 'subtitle': return `<p class="subtitle">${esc(b.text).replace(/\n/g, '<br>')}</p>`;
    case 'heading': return `<h2 style="font-size:${Number(b.size) || 15}px">${esc(b.text)}</h2>`;
    case 'text': return `<p class="t-${esc(b.style ?? 'body')}">${esc(b.text).replace(/\n/g, '<br>')}</p>`;
    case 'bullets': return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'figures': return `<div class="figures">${b.figures.map((f) => `<div><span>${esc(f.label)}</span><b>${esc(f.value)}</b><small>${esc(f.sub)}</small></div>`).join('')}</div>`;
    case 'table': return `<table><thead><tr>${b.cols.map((c) => `<th style="width:${Number(c.width) * 100}%;text-align:${c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left'}">${esc(c.title)}</th>`).join('')}</tr></thead>
      <tbody>${b.rows.map((r) => `<tr>${r.map((cell, i) => `<td style="text-align:${b.cols[i]?.align === 'right' ? 'right' : b.cols[i]?.align === 'center' ? 'center' : 'left'}">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'image':
      if (b.image !== 'plan' || !ctx.plan) return '';
      return `<img class="plan" src="${ctx.plan}" style="max-height:${(Number(b.height) || 300) * 1.333}px" alt="Duct plan">`;
    case 'legend':
      return `<div class="legend">${(b.sizes ?? []).map((mm) => `<span><i style="background:${DUCT(mm)}"></i>Ø${Number(mm)}</span>`).join('')}
        <span><i style="background:${DUCT(b.returnMM)}"></i>Ø${Number(b.returnMM)} return</span><p>${esc(b.text)}</p></div>`;
    case 'page': return '<div class="pagebreak"></div>';
  }
  return '';
}

/// The report as a page of its own (shown in the designer's preview, printed from there).
export async function build(kind, { app, call, Plan }) {
  const biz = store.business();
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  let doc;
  try {
    doc = await call('report', { project: app.project, kind, date,
      business: { name: biz.name ?? '', contact: biz.contact ?? '', phone: biz.phone ?? '', email: biz.email ?? '', abn: biz.abn ?? '', licence: biz.licence ?? '', website: biz.website ?? '' } });
  } catch (e) {
    return { error: e.message };
  }
  // The plan at the report's size: the house's own shape on the install sheet.
  let plan = null;
  if (doc.blocks.some((b) => b.type === 'image' && b.image === 'plan')) {
    const b = app.view.bounds;
    const aspect = kind === 'install' ? Math.max(0.4, Math.min(2.2, (b[3] - b[1] + 1.5) / Math.max(b[2] - b[0] + 1.5, 1))) : 620 / 900;
    plan = planImage(app, Plan, 1000, Math.round(1000 * aspect));
  }
  const ctx = { plan, logo: /^data:image\/png;base64,/.test(biz.logo ?? '') ? biz.logo : null };
  return { title: doc.title, html: `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.5pt/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #3E3A33; background: #F2F2F0; }
  .sheet { background: #fff; width: 210mm; min-height: 297mm; margin: 16px auto; padding: 14mm 14mm 20mm; box-shadow: 0 4px 30px rgba(0,0,0,.08); }
  h1, h2 { font-family: Archivo, -apple-system, sans-serif; font-weight: 800; color: #101010; letter-spacing: -.02em; }
  h1 { font-size: 24pt; margin: 18px 0 2px; } h1.section { font-size: 18pt; margin-top: 0; } h1.sheet { font-size: 22pt; margin-top: 0; }
  h2 { margin: 18px 0 6px; break-after: avoid; }
  .subtitle { color: #5E5A52; font-size: 11.5pt; margin: 2px 0 14px; }
  .letterhead { display: flex; gap: 12px; align-items: flex-start; }
  .letterhead .logo { max-width: 120px; max-height: 46px; object-fit: contain; }
  .letterhead .mark { width: 46px; height: 46px; border-radius: 12px; background: #E9A21C; display: grid; place-items: center; font: 800 15px Archivo, sans-serif; color: #101010; }
  .letterhead .who { flex: 1; font-size: 8.5pt; color: #5E5A52; } .letterhead .who b { font: 800 12pt Archivo, sans-serif; color: #101010; display: block; }
  .letterhead .date { font-size: 9pt; color: #5E5A52; }
  .figures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0 14px; }
  .figures div { background: #F4F2ED; border-radius: 10px; padding: 9px 11px; }
  .figures span { font-size: 7.5pt; font-weight: 700; letter-spacing: .08em; color: #8C877D; display: block; }
  .figures b { font: 800 16pt Archivo, sans-serif; color: #101010; display: block; letter-spacing: -.02em; }
  .figures small { font-size: 8pt; color: #5E5A52; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; font-size: 9.5pt; }
  th { font-size: 7.5pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #5E5A52; padding: 5px 6px; border-bottom: 1px solid #DEDCD6; }
  td { padding: 5px 6px; border-bottom: 1px solid #EEECE7; vertical-align: top; } tr { break-inside: avoid; }
  ul { margin: 4px 0 8px; padding-left: 18px; } li { margin: 3px 0; }
  img.plan { width: 100%; object-fit: contain; border-radius: 10px; border: 1px solid #EEECE7; margin: 4px 0 8px; display: block; }
  .legend { font-size: 8.5pt; color: #101010; font-weight: 600; margin-bottom: 6px; } .legend span { display: inline-flex; align-items: center; gap: 5px; margin-right: 14px; }
  .legend i { width: 18px; height: 6px; border-radius: 3px; display: inline-block; } .legend p { font-weight: 400; color: #5E5A52; margin: 4px 0 0; }
  .t-small { font-size: 8pt; color: #8C877D; } .t-note { font-size: 9pt; color: #5E5A52; } .t-strong { font-weight: 700; color: #101010; margin-top: 18px; } .t-brand { font-size: 8.5pt; color: #5E5A52; }
  .pagebreak { break-after: page; height: 0; }
  .footer { position: fixed; bottom: 6mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #8C877D; display: none; }
  @media print { body { background: #fff; } .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; } .footer { display: block; } }
</style></head><body>
<div class="sheet">${doc.blocks.map((b) => block(b, ctx)).join('\n')}</div>
<div class="footer">${esc(doc.footer)}</div>
</body></html>` };
}
