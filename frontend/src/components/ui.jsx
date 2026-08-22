import React, { useEffect, useRef, useState } from "react";
import logoFull from "../assets/logo-full.svg";
import logoMark from "../assets/logo-mark.svg";

/* =====================================================================
   Logo, the supplied artwork as vector: the full lockup (768x419) and
   the brain-and-crosshair mark on a square canvas (768x768). Both carry
   alpha, so they sit directly on the near-black ground.

   Both set `max-width: none` to escape Tailwind preflight's
   `img { max-width: 100% }`. Inside a flex parent with no definite width
   that rule resolves the logo to zero. Display lives in the class list, not
   inline, so callers can still hide either one responsively. The intrinsic
   width/height attributes must match the artboards above, or the browser's
   aspect-ratio placeholder stretches the mark.
   ===================================================================== */
export function LogoMark({ size = 34, className = "" }) {
  return (
    <img
      src={logoMark}
      alt=""
      width={size}
      height={size}
      className={`block ${className}`}
      style={{ width: size, height: size, maxWidth: "none" }}
      aria-hidden="true"
    />
  );
}

/** The full lockup. Height-driven; the aspect ratio comes from the file. */
export function Logo({ height = 34, className = "" }) {
  return (
    <img
      src={logoFull}
      alt="TumorSight"
      width={768}
      height={419}
      className={`block ${className}`}
      style={{ height, width: "auto", maxWidth: "none" }}
    />
  );
}

/** Text wordmark, used where the raster lockup would be too wide. */
export function Wordmark({ className = "" }) {
  return (
    <span
      className={`font-display font-bold tracking-[-0.03em] ${className}`}
      style={{ color: "var(--ts-cream)" }}
    >
      Tumor<span className="grad-text">Sight</span>
    </span>
  );
}

/* =====================================================================
   Reveal, one shared scroll-in transition so motion feels like a
   single system instead of per-component improvisation.
   ===================================================================== */
export function Reveal({ children, delay = 0, className = "", style, as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);

    // Failsafe: content is hidden until this fires, so anything that stops
    // the observer from ever reporting (an offscreen render, a blocked
    // extension) would blank the page. Reveal unconditionally after a beat.
    const failsafe = setTimeout(() => setSeen(true), 2000);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* =====================================================================
   Section furniture
   ===================================================================== */
export function Eyebrow({ children, tone = "deep", className = "" }) {
  return (
    <span
      className={`t-eyebrow inline-flex items-center gap-2.5 ${className}`}
      style={{ color: tone === "deep" ? "var(--ts-cream-3)" : "var(--ts-ink-2)" }}
    >
      <span
        className="inline-block h-[6px] w-[6px] rounded-full"
        style={{ background: "var(--ts-coral)", boxShadow: "0 0 10px 1px rgba(255,122,84,.8)" }}
      />
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, lead, tone = "deep", align = "left", className = "" }) {
  const isWarm = tone === "warm";
  return (
    <header
      className={`${align === "center" ? "text-center mx-auto items-center" : ""} flex flex-col gap-4 ${className}`}
      style={{ maxWidth: align === "center" ? "44rem" : undefined }}
    >
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2 className="t-h2" style={{ color: isWarm ? "var(--ts-ink)" : "var(--ts-cream)" }}>
        {title}
      </h2>
      {lead && (
        <p
          className="t-lead max-w-prose"
          style={{ color: isWarm ? "var(--ts-ink-2)" : "var(--ts-cream-2)" }}
        >
          {lead}
        </p>
      )}
    </header>
  );
}

/** Ambient magenta/coral blooms, the only "glow" the layout gets. */
export function Aurora({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="drift absolute -top-32 -left-24 h-[34rem] w-[34rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(125,45,92,.55), transparent 68%)", filter: "blur(28px)" }}
      />
      <div
        className="drift absolute -bottom-40 -right-20 h-[32rem] w-[32rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,122,84,.32), transparent 68%)",
          filter: "blur(34px)",
          animationDelay: "-7s",
        }}
      />
    </div>
  );
}

/** Full-width band. `tone` switches the whole surface family. */
export function Band({ tone = "deep", children, className = "", id }) {
  const bg =
    tone === "warm"
      ? "var(--ts-sand)"
      : tone === "deepest"
      ? "var(--ts-deep)"
      : "var(--ts-canvas)";
  return (
    <section id={id} className={`relative ${className}`} style={{ background: bg }}>
      {children}
    </section>
  );
}

export function Shell({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-shell px-6 sm:px-8 ${className}`}>{children}</div>;
}

/** Four L-shaped brackets, the recurring "instrument frame" motif. */
export function CornerBrackets({ inset = "1rem", size = "1.6rem", color = "rgba(255,171,122,.55)" }) {
  const corners = [
    { top: inset, left: inset, borderTop: true, borderLeft: true },
    { top: inset, right: inset, borderTop: true, borderRight: true },
    { bottom: inset, left: inset, borderBottom: true, borderLeft: true },
    { bottom: inset, right: inset, borderBottom: true, borderRight: true },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {corners.map((c, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: size,
            height: size,
            borderTop: c.borderTop ? `1.5px solid ${color}` : undefined,
            borderBottom: c.borderBottom ? `1.5px solid ${color}` : undefined,
            borderLeft: c.borderLeft ? `1.5px solid ${color}` : undefined,
            borderRight: c.borderRight ? `1.5px solid ${color}` : undefined,
            borderTopLeftRadius: c.borderTop && c.borderLeft ? 6 : undefined,
            borderTopRightRadius: c.borderTop && c.borderRight ? 6 : undefined,
            borderBottomLeftRadius: c.borderBottom && c.borderLeft ? 6 : undefined,
            borderBottomRightRadius: c.borderBottom && c.borderRight ? 6 : undefined,
          }}
        />
      ))}
    </div>
  );
}
