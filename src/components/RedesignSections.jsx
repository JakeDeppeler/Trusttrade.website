import { useEffect, useState } from "react";

/* Scroll-reveal: add `.in` to every `.reveal` as it enters the viewport.
   Throttled rect check — reliable and dependency-free. Shared by the
   redesigned pages (How it works, For tradies). */
export function usePageReveal() {
  useEffect(() => {
    const sel = ".reveal:not(.in)";
    let last = 0;
    let timer = 0;
    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) el.classList.add("in");
      });
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - last > 90) {
        last = now;
        check();
      } else {
        clearTimeout(timer);
        timer = setTimeout(check, 100);
      }
    };
    check();
    const t1 = setTimeout(check, 120);
    const t2 = setTimeout(check, 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}

/* Alternating device row — copy on one side, a phone with floating chips on
   the other. `flip` swaps the sides on wide screens. */
export function DevRow({ idx, kicker, title, italic, body, facts, img, chips, flip }) {
  return (
    <div className={"dev-row" + (flip ? " flip" : "")}>
      <div className="dev-copy reveal">
        <div className="dev-kicker">
          <span className="idx">{idx}</span> {kicker}
        </div>
        <h3>
          {title} {italic && <span className="it">{italic}</span>}
        </h3>
        <p>{body}</p>
        <div className="dev-facts">
          {facts.map((f, i) => (
            <div className="dev-fact" key={i}>
              {f}
            </div>
          ))}
        </div>
      </div>
      <div className="dev-stage reveal reveal-scale" style={{ "--rd": "120ms" }}>
        <div className="phone">
          <div className="phone-screen">
            <img src={img} alt="" loading="lazy" decoding="async" width={1284} height={2778} />
          </div>
        </div>
        {chips.map((c, i) => (
          <div className={"dev-chip c" + (i + 1)} key={i}>
            <div className="lbl">
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }}
              />
              {c.lbl}
            </div>
            <strong>{c.big}</strong>
            {c.sub && <div className="sub">{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Social-proof marquee ticker. `items` is an array of [big, rest] pairs. */
export function Marquee({ items }) {
  const run = items.concat(items);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {run.map((it, i) => (
          <span className="marquee-item" key={i}>
            <span className="dot" />
            <span>
              <span className="it">{it[0]}</span> {it[1]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* Grouped FAQ accordion — mirrors the site's faq markup so it inherits the
   existing open/close styling. `groups` is [{ name, items:[{q,a}] }]. */
export function FaqAccordion({ groups, idPrefix = "faq" }) {
  const [openIds, setOpenIds] = useState({});
  const toggle = (id) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));
  return (
    <div className="faq-groups">
      {groups.map((g) => (
        <div key={g.name} className="faq-group">
          <div className="faq-section-title">{g.name}</div>
          <div className="faq-grid">
            {g.items.map((item, i) => {
              const id = g.name + "-" + i;
              const isOpen = !!openIds[id];
              const panelId = `${idPrefix}-a-${id}`;
              const buttonId = `${idPrefix}-q-${id}`;
              return (
                <div key={id} className={"faq-item " + (isOpen ? "open" : "")}>
                  <button
                    type="button"
                    className="faq-q"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(id)}
                  >
                    <span>{item.q}</span>
                    <span className="plus" aria-hidden="true">+</span>
                  </button>
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-a">
                    <div className="faq-a-inner">
                      <div className="faq-a-text">{item.a}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
