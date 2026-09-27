/* The public tradie profile and tradie cards, drawn the way the app draws them
   (design/screens NewProfile and the Find cards). Shared by scripts/gen-tradie-pages.mjs,
   which runs it in Node at build time, and the pages it writes, which run the same code in
   the browser to show live data. Plain functions that return HTML strings: no DOM, no
   imports. Every slot is bound to the real listing and its reviews; anything a listing
   doesn't have is left out rather than filled in. */
var TT = (function () {
  var APP_STORE = 'https://apps.apple.com/au/app/trust-trade/id6778369757';
  // Stock-library images aren't the tradie's work, so they never show as their photos.
  var STOCK = /(^|\/\/)([a-z0-9-]+\.)*(unsplash\.com|pexels\.com|pixabay\.com|istockphoto\.com|shutterstock\.com|gettyimages\.)/i;
  // Badges that repeat what every listed tradie already is, or that we can't stand behind.
  var GENERIC = /^(verified|insured)$|licen|abn|police|background|star|review|trusttrade|guarantee/i;
  var YEARS = /^\s*(\d{1,2})\+?\s*(yrs?|years?)\b/i;
  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DAY = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) { return '$' + Number(v || 0).toLocaleString('en-AU'); }
  function firstWord(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  // "Sarah M.": how the app names a customer.
  function shortName(n) {
    var p = String(n || '').trim().split(/\s+/).filter(Boolean);
    return p.length ? p[0] + (p[1] ? ' ' + p[1][0].toUpperCase() + '.' : '') : 'Customer';
  }
  // Licence numbers are part-hidden on the public profile, as in the app.
  function mask(x) { var v = String(x || '').replace(/\s+/g, ''); return v.length <= 4 ? v : v.slice(0, 1) + '•••••' + v.slice(-2); }
  function suburbOf(l) { return l.suburb || String(l.location || '').split(',')[0] || ''; }
  function coverPos(p) { return /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(p || '')) ? p : '50% 50%'; }
  function ownPhotos(l) {
    return (Array.isArray(l.photos) ? l.photos : []).filter(function (u) { return u && typeof u === 'string' && !STOCK.test(u); });
  }
  // The rating customers see: the real reviews, never the listing's stored rating.
  function rating(reviews) {
    var R = (reviews || []).filter(function (r) { return r && !r.hidden; });
    var avg = R.length ? R.reduce(function (a, r) { return a + (Number(r.rating) || 0); }, 0) / R.length : null;
    return { avg: avg, n: R.length, list: R };
  }
  // priced_services comes in two shapes: [{name, items:[...]}] sections, or flat [{name, unit, price}].
  function priced(l) {
    var out = [];
    (Array.isArray(l.priced_services) ? l.priced_services : []).forEach(function (x) {
      if (x && Array.isArray(x.items)) x.items.forEach(function (it) {
        out.push({ name: it.name || x.name, desc: it.desc || it.description || '', price: it.price, from: !!(it.from || it.unit === 'from'), label: it.label });
      });
      else if (x && x.name) out.push({ name: x.name, desc: x.desc || x.description || '', price: x.price, from: !!(x.from || x.unit === 'from'), label: x.label });
    });
    return out.filter(function (x) { return x.name; });
  }
  function hm24(x) {
    var m = String(x || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i); if (!m) return '';
    var h = +m[1]; if (m[3]) { var pm = /pm/i.test(m[3]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    return (h < 10 ? '0' : '') + h + ':' + m[2];
  }
  // ["Mon to Fri, 7am to 5pm", "Sat emergencies only"] from business_hours (or the older opening_hours).
  function hours(l) {
    var h = (l.business_hours && typeof l.business_hours === 'object' && Object.keys(l.business_hours).length) ? l.business_hours : l.opening_hours;
    if (!h || typeof h !== 'object') return [];
    function t(x) { var v = hm24(x); if (!v) return String(x || ''); var hh = +v.slice(0, 2), mm = +v.slice(3); return (((hh + 11) % 12) + 1) + (mm ? ':' + v.slice(3) : '') + (hh < 12 ? 'am' : 'pm'); }
    function day(d) {
      var v = h[d]; if (!v) return 'closed';
      if (Array.isArray(v)) return (v[0] || v[1]) ? t(v[0]) + ' to ' + t(v[1]) : 'closed';
      if (v.mode === 'closed' || v.closed) return 'closed';
      if (v.mode === 'emergency' || v.emergencyOnly) return 'emergencies only';
      if (v.open || v.close) {
        if (hm24(v.open) === '00:00' && /^(23:59|24:00)/.test(hm24(v.close) || String(v.close || ''))) return 'open 24 hours';
        return t(v.open) + ' to ' + t(v.close);
      }
      return 'closed';
    }
    var vals = DAYS.map(day);
    if (vals.every(function (v) { return v === 'open 24 hours'; })) return ['Open 24/7'];
    var parts = [], i = 0;
    while (i < 7) {
      var j = i; while (j + 1 < 7 && vals[j + 1] === vals[i]) j++;
      if (vals[i] !== 'closed') parts.push((i === j ? DAY[DAYS[i]] : DAY[DAYS[i]] + ' to ' + DAY[DAYS[j]]) + (i === j ? ' ' : ', ') + vals[i]);
      i = j + 1;
    }
    return parts;
  }
  function years(l) {
    var b = Array.isArray(l.badges) ? l.badges : [];
    for (var i = 0; i < b.length; i++) { var m = String(b[i]).match(YEARS); if (m && +m[1] > 0) return +m[1]; }
    return 0;
  }
  function team(t) {
    var v = String(t == null ? '' : t).trim(); if (!v) return '';
    if (/^\d+$/.test(v)) return v === '1' ? 'Works solo' : v + ' on the team';
    var M = { solo: 'Works solo', sole_trader: 'Works solo', owner_operator: 'Owner operated', small_team: 'Small team', medium_team: 'Medium team', large_team: 'Large team' };
    return M[v] || v.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
  }
  function ago(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return '';
    var days = Math.floor((Date.now() - d.getTime()) / 864e5);
    if (days < 1) return 'Today'; if (days < 2) return 'Yesterday'; if (days < 7) return days + ' days ago';
    if (days < 30) { var w = Math.floor(days / 7); return w + (w === 1 ? ' week' : ' weeks') + ' ago'; }
    if (days < 365) { var mo = Math.floor(days / 30); return mo + (mo === 1 ? ' month' : ' months') + ' ago'; }
    var y = Math.floor(days / 365); return y + (y === 1 ? ' year' : ' years') + ' ago';
  }

  var I = {
    star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.8z"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    badge: '<path d="M12 3l2.4 1.7 2.9-.2.9 2.8 2.3 1.8-1 2.8 1 2.8-2.3 1.8-.9 2.8-2.9-.2L12 21l-2.4-1.7-2.9.2-.9-2.8-2.3-1.8 1-2.8-1-2.8 2.3-1.8.9-2.8 2.9.2z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7 2.3-2.3z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7 2 0 3 2 1 4l-3 3M14 12c4 0 7 1 7 4 0 2-2 3-4 1l-3-3M12 14c0 4-1 7-4 7-2 0-3-2-1-4l3-3M10 12c-4 0-7-1-7-4 0-2 2-3 4-1l3 3"/>',
    brush: '<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-5 2-5 5 0 1.5-1 2.5-2 3 3 1 7 0 8-2 1-1.5 1-3 0-4"/>',
    roof: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/>',
    hammer: '<path d="M14 6l4 4M4 20l9-9M11 4l7 7 2-2-7-7z"/>',
    apple: '<path d="M17.05 12.94c.02-2.34 1.92-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.85-1.43-.15-2.81.86-3.54.86-.74 0-1.86-.84-3.06-.82-1.57.02-3.03.92-3.84 2.33-1.65 2.86-.42 7.08 1.18 9.4.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.63-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.59 1.29-2.65-.03-.01-2.47-.95-2.51-3.79zM14.74 5.72c.66-.8 1.1-1.91.98-3.02-.95.04-2.09.63-2.77 1.43-.61.71-1.14 1.84-1 2.94 1.06.08 2.13-.54 2.79-1.35z"/>'
  };
  function ic(name, cls) { return '<svg class="ti' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I[name] + '</svg>'; }
  function tradeIc(trade) {
    var t = String(trade || '').toLowerCase();
    if (/elec/.test(t)) return 'bolt'; if (/plumb|gas/.test(t)) return 'drop'; if (/hvac|air|heat|cool/.test(t)) return 'fan';
    if (/paint/.test(t)) return 'brush'; if (/roof/.test(t)) return 'roof'; if (/carp|build|handy/.test(t)) return 'hammer';
    return 'wrench';
  }
  function tint(trade) {
    var t = String(trade || '').toLowerCase();
    if (/elec/.test(t)) return '#F7E9C6'; if (/plumb/.test(t)) return '#DCE7FF';
    if (/hvac|air|gas/.test(t)) return '#D9EEDE'; if (/carp|build/.test(t)) return '#F0E4D4'; if (/paint/.test(t)) return '#F3DFE6';
    return '#EDE7DA';
  }
  function stars(n) { var h = ''; for (var k = 1; k <= 5; k++) h += '<svg class="tst' + (k <= n ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I.star + '</svg>'; return h; }
  function appStore(cls) {
    return '<a class="appstore' + (cls ? ' ' + cls : '') + '" href="' + APP_STORE + '" target="_blank" rel="noopener"><span class="glyph"><svg width="22" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + I.apple + '</svg></span><span class="as-txt"><span class="small">Download on the</span><span class="big">App Store</span></span></a>';
  }
  var MAP = '<svg class="tp-mapsvg" viewBox="0 0 350 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="350" height="230" fill="#EAE6DD"/><path d="M300 0 C 280 60 320 120 350 150 L350 0 Z" fill="#D5E1CF"/><g fill="none" stroke="#FFFFFF" stroke-linecap="round"><path d="M-10 80 C 90 90 200 96 360 70" stroke-width="7"/><path d="M60 -10 C 90 70 120 150 110 240" stroke-width="5"/><path d="M-10 150 C 100 140 220 160 360 190" stroke-width="4"/><path d="M260 -10 C 240 70 250 160 270 240" stroke-width="4"/></g><circle cx="175" cy="115" r="106" fill="rgba(233,162,28,0.16)" stroke="#E9A21C" stroke-width="2.5" stroke-dasharray="7 6"/></svg>';

  // A tradie card for the directory and the trade/area pages (the app's Find card).
  function card(l, reviews) {
    var r = rating(reviews), sub = suburbOf(l);
    var cover = l.photo || ownPhotos(l)[0] || '';
    var style = cover ? 'background-image:url(&quot;' + esc(cover) + '&quot;);background-position:' + coverPos(l.cover_position) : 'background:' + tint(l.trade);
    var rate = r.n ? '<span class="tc-rate">' + ic('star', 'fill') + '<b>' + r.avg.toFixed(1) + '</b><span>' + r.n + ' review' + (r.n === 1 ? '' : 's') + '</span></span>'
      : '<span class="tc-rate tc-new">New on Trust Trade</span>';
    var search = (l.name + ' ' + (l.trade || '') + ' ' + sub + ' ' + (l.postcode || '')).toLowerCase();
    return '<a class="tc" href="/tradie/' + encodeURIComponent(l.slug) + '" data-s="' + esc(search) + '" data-trade="' + esc(String(l.trade || '').toLowerCase()) + '">'
      + '<span class="tc-cover" style="' + style + '">' + (cover ? '' : ic(tradeIc(l.trade), 'tc-glyph')) + '<span class="tc-ver">' + ic('check') + 'Verified</span></span>'
      + '<span class="tc-body"><b class="tc-name">' + esc(l.name) + '</b><span class="tc-sub">' + esc([l.trade, sub].filter(Boolean).join(' · ')) + '</span>' + rate + '</span></a>';
  }

  // The whole profile page body: hero, stats, sections, and the side panel.
  function profile(l, reviews, opt) {
    opt = opt || {};
    var name = l.name || 'Tradie', nm = esc(name), first = esc(firstWord(name) || 'them');
    var sub = suburbOf(l), r = rating(reviews);
    var cover = l.photo || '';
    var hero = '<section class="tp-hero' + (cover ? '' : ' tp-nophoto') + '"' + (cover ? ' style="background-image:url(&quot;' + esc(cover) + '&quot;);background-position:' + coverPos(l.cover_position) + '"' : ' style="background-color:' + tint(l.trade) + '"') + '>'
      + (cover ? '' : ic(tradeIc(l.trade), 'tp-heroic'))
      + '<div class="tp-id"><h1>' + nm + '</h1><p>' + esc([l.trade, sub].filter(Boolean).join(' · ')) + '</p></div></section>';

    // stats: real rating, then years trading / team / jobs done, then reply time or travel radius
    function stat(v, k, star) { return '<div class="tp-stat"><b>' + (star ? ic('star', 'fill tp-star') : '') + v + '</b><span>' + k + '</span></div>'; }
    var S = [r.n ? stat(r.avg.toFixed(1), r.n + ' review' + (r.n === 1 ? '' : 's'), true) : stat('New', 'No reviews yet')];
    var yrs = years(l), teamN = String(l.team_size == null ? '' : l.team_size).match(/^\s*(\d+)\s*$/);
    if (yrs) S.push(stat(yrs + ' yrs', 'Trading'));
    else if (teamN) S.push(stat(teamN[1], 'On the team'));
    else if (Number(l.stat_jobs_complete) > 0) S.push(stat(esc(l.stat_jobs_complete), 'Jobs done'));
    var rc = Number(l.stat_response_count) || 0, rh = Number(l.stat_response_hours_total) || 0;
    var reply = rc > 0 ? ((rh / rc) < 1 ? '&lt;1 hr' : '~' + Math.round(rh / rc) + (Math.round(rh / rc) === 1 ? ' hr' : ' hrs')) : '';
    if (reply) S.push(stat(reply, 'To reply'));
    else if (l.service_radius_km) S.push(stat(esc(l.service_radius_km) + ' km', 'Travels'));
    var stats = '<div class="tp-stats">' + S.join('') + '</div>';

    var photos = ownPhotos(l);
    var P = priced(l);
    var plain = (Array.isArray(l.services) ? l.services : []).map(function (x) { return String(x).trim(); })
      .filter(function (x) { return x && !P.some(function (p) { return String(p.name).toLowerCase() === x.toLowerCase(); }); });
    var nSvc = P.length + plain.length;
    var tabs = '<nav class="tp-tabs" aria-label="On this page"><a href="#about" class="on">About</a><a href="#photos">Photos</a><a href="#services">Services</a><a href="#reviews">Reviews</a></nav>';

    // About: bio + chips, and where they work
    var badges = (Array.isArray(l.badges) ? l.badges : []).map(function (b) { return String(b).trim(); }).filter(Boolean);
    var emergency = badges.some(function (b) { return /emergenc|24\/7/i.test(b); });
    var tm = team(l.team_size);
    var chips = badges.filter(function (b) { return !GENERIC.test(b) && !/emergenc|24\/7/i.test(b) && !YEARS.test(b) && b.length <= 34; }).slice(0, 4);
    if (tm && !(teamN && !yrs)) chips.push(tm);
    var chipHTML = chips.map(function (c) { return '<span class="tp-chip">' + esc(c) + '</span>'; }).join('') + (emergency ? '<span class="tp-chip g">Emergency call-outs</span>' : '');
    var bio = String(l.description || '').trim();
    var about = '<section class="tp-sec"><h2>About ' + nm + '</h2>' + (bio ? '<p class="tp-bio">' + esc(bio) + '</p>' : '<p class="tp-bio tp-mu">No bio yet.</p>') + (chipHTML ? '<div class="tp-chips">' + chipHTML + '</div>' : '') + '</section>';
    var rad = Number(l.service_radius_km) || 0;
    var area = (rad || sub) ? '<section class="tp-sec"><h2>Where they work</h2>' + (rad ? '<div class="tp-map">' + MAP + '<span class="tp-mappin">' + ic(tradeIc(l.trade)) + '</span><span class="tp-mapchip">Travels ' + rad + ' km</span></div>' : '')
      + '<p class="tp-base">' + ic('pin') + '<b>' + esc(sub) + (l.postcode ? ' ' + esc(l.postcode) : '') + (rad ? ' · ' + rad + ' km radius' : '') + '</b></p></section>' : '';

    // Photos: their own, never stock
    var gallery = '<section class="tp-sec"><div class="tp-shead"><h2>' + (photos.length ? photos.length + ' photo' + (photos.length === 1 ? '' : 's') : 'Photos') + '</h2></div>'
      + (photos.length ? '<div class="tp-photos">' + photos.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="' + nm + ' work photo" loading="lazy"></a>'; }).join('') + '</div>'
        : '<p class="tp-bio tp-mu">No photos yet.</p>')
      + '<p class="tp-note">' + ic('badge') + '<span>These are ' + first + '&#39;s own photos. Once a tradie is live, new photos can only come from jobs done through Trust Trade.</span></p></section>';

    // Services: priced items (either shape) and plain services; then good to know, then brands
    function row(n, d, price) { return '<div class="tp-svc"><span class="tp-tx"><b>' + esc(n) + '</b>' + (d ? '<small>' + esc(d) + '</small>' : '') + '</span>' + (price ? '<span class="tp-price">' + price + '</span>' : '') + '</div>'; }
    var svcRows = P.map(function (x) { return row(x.name, x.desc, x.price != null && x.price !== '' ? (x.from ? 'From ' : '') + money(x.price) + ' + GST' : esc(x.label || '')); }).join('')
      + plain.map(function (x) { return row(x, '', ''); }).join('');
    var services = '<section class="tp-sec"><div class="tp-shead"><h2>' + (nSvc ? nSvc + ' service' + (nSvc === 1 ? '' : 's') : 'Services') + '</h2><span>Quotes on request</span></div>'
      + (svcRows ? '<div class="tp-rows">' + svcRows + '</div>' : '<p class="tp-bio tp-mu">No services listed yet.</p>')
      + '<p class="tp-note">' + ic('card') + '<span>Trust Trade takes no commission. The price ' + first + ' quotes is the price you pay.</span></p></section>';
    function chk(icon, t, s, tag, g) { return '<div class="tp-chk"><span class="tp-ic">' + ic(icon) + '</span><span class="tp-tx"><b>' + t + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</span>' + (tag ? '<span class="tp-tag' + (g ? ' g' : '') + '">' + tag + '</span>' : '') + '</div>'; }
    var gk = [];
    if (emergency) gk.push(chk('clock', 'Emergency call-outs', 'After hours and weekends', 'Yes', true));
    if (l.call_out_fee != null && l.call_out_fee !== '' && l.show_call_out !== false) gk.push(chk('card', 'Call-out fee', 'Their standard call-out', money(l.call_out_fee) + ' + GST'));
    if (Number(l.hourly_rate) > 0) gk.push(chk('clock', 'Hourly rate', 'Their standard labour rate', money(l.hourly_rate) + '/hr + GST'));
    var goodToKnow = gk.length ? '<section class="tp-sec"><h2>Good to know</h2><div class="tp-rows">' + gk.join('') + '</div></section>' : '';
    var brands = (Array.isArray(l.brands) ? l.brands : []).map(function (b) { return String(b).trim(); }).filter(Boolean);
    var dealer = (Array.isArray(l.dealer_brands) ? l.dealer_brands : []).map(function (b) { return String(b).trim().toLowerCase(); });
    var brandSec = brands.length ? '<section class="tp-sec"><h2>Brands they work with</h2><div class="tp-chips">' + brands.map(function (b) { return '<span class="tp-chip">' + esc(b) + (dealer.indexOf(b.toLowerCase()) >= 0 ? '<em class="tp-dealer">Dealer</em>' : '') + '</span>'; }).join('') + '</div></section>' : '';

    // Reviews: real ones only, names as "Sarah M.", "Verified job" only where a booking backs it
    var reviewsSec;
    if (!r.n) {
      reviewsSec = '<section class="tp-sec tp-rempty">' + ic('star') + '<h2>No reviews yet.</h2><p>A review can only come from a job booked through Trust Trade, so the ones you read are worth reading.</p></section>';
    } else {
      var counts = [5, 4, 3, 2, 1].map(function (x) { return r.list.filter(function (v) { return Math.round(Number(v.rating)) === x; }).length; });
      var bars = [5, 4, 3, 2, 1].map(function (x, i) { return '<div class="tp-bar"><span>' + x + '</span><i><b style="width:' + Math.round(counts[i] / r.n * 100) + '%"></b></i><em>' + counts[i] + '</em></div>'; }).join('');
      var allVer = r.list.every(function (v) { return v.verified || v.booking_id; });
      var cards = r.list.slice(0, 20).map(function (v) {
        var who = shortName(v.from_name), ver = !!(v.verified || v.booking_id);
        return '<div class="tp-rev"><div class="tp-revh"><span class="tp-revav">' + esc(who[0] || 'C') + '</span><span class="tp-tx"><b>' + esc(who) + '</b><small>' + esc(ago(v.created_at)) + '</small></span><span class="tp-stars">' + stars(Math.round(Number(v.rating) || 0)) + '</span></div>'
          + (v.review_text ? '<p>' + esc(v.review_text) + '</p>' : '') + (ver ? '<span class="tp-vjob">' + ic('badge') + 'Verified job</span>' : '')
          + (v.reply_text ? '<div class="tp-reply"><b>Reply from ' + nm + '</b>' + esc(v.reply_text) + '</div>' : '') + '</div>';
      }).join('');
      reviewsSec = '<section class="tp-sec"><h2>' + r.avg.toFixed(1) + ' from ' + r.n + ' review' + (r.n === 1 ? '' : 's') + '</h2><div class="tp-rsum"><div class="tp-rbig"><b>' + r.avg.toFixed(1) + '</b><span class="tp-stars">' + stars(Math.round(r.avg)) + '</span><small>' + r.n + ' review' + (r.n === 1 ? '' : 's') + '</small></div><div class="tp-bars">' + bars + '</div></div>'
        + '<p class="tp-note">' + ic('badge') + '<span>' + (allVer ? 'Every review here is from a job booked and finished through Trust Trade.' : 'Reviews marked Verified job came from a job booked and finished through Trust Trade.') + '</span></p></section>'
        + '<section class="tp-sec"><div class="tp-shead"><h2>Newest first</h2></div><div class="tp-rows">' + cards + '</div></section>';
    }

    // Side panel: get a quote in the app, licence and checks, hours
    var checks = '';
    if (l.licence) checks += chk('badge', 'Trade licence', 'Licence ' + esc(mask(l.licence)) + ' · checked by a person');
    else if (l.qualified) checks += chk('badge', 'Licensed trade', 'Checked by a person when they joined');
    if (l.abn) checks += chk('doc', 'ABN ' + esc(l.abn), 'Checked against the ABR');
    var hrs = hours(l);
    var side = '<div class="tp-card tp-cta"><h2>Get a quote from ' + first + '</h2><p>Send your job in the Trust Trade app. Your enquiry goes to ' + nm + ' only, no one else.</p>' + appStore() + '<small>Now on iPhone · Android coming soon</small></div>'
      + ((checks || hrs.length) ? '<div class="tp-card">'
        + (checks ? '<section class="tp-sec"><h2>Licence &amp; checks</h2><div class="tp-rows">' + checks + '</div><a class="tp-how" href="/how-we-verify">How we check tradies</a></section>' : '')
        + (hrs.length ? '<section class="tp-sec"><h2>Hours</h2><div class="tp-rows">' + chk('clock', '<span class="tp-hrs">' + hrs.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</span>', '') + '</div></section>' : '')
        + '</div>' : '');

    return '<div class="tp">' + (opt.crumbs || '') + hero + stats + tabs
      + '<div class="tp-grid"><div class="tp-main">'
      + '<div class="tp-card" id="about">' + about + area + '</div>'
      + '<div class="tp-card" id="photos">' + gallery + '</div>'
      + '<div class="tp-card" id="services">' + services + goodToKnow + brandSec + '</div>'
      + '<div class="tp-card" id="reviews">' + reviewsSec + '</div>'
      + '</div><aside class="tp-side">' + side + '</aside></div>'
      + '<div class="tp-dock"><a href="' + APP_STORE + '" target="_blank" rel="noopener">Get a quote in the app</a><small>Your enquiry goes to ' + nm + ' only, no one else.</small></div>'
      + '</div>';
  }

  return { APP_STORE: APP_STORE, esc: esc, card: card, profile: profile, rating: rating, ownPhotos: ownPhotos, appStore: appStore, suburbOf: suburbOf };
})();
