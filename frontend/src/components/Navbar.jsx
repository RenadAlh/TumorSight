import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Crosshair, Menu, X } from "lucide-react";
import { LogoMark } from "./ui.jsx";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/demo", label: "Analysis" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className="sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-500"
      style={{
        background: solid ? "rgba(22, 58, 55, 0.82)" : "transparent",
        backdropFilter: solid ? "blur(14px) saturate(140%)" : "none",
        borderBottom: `1px solid ${solid ? "var(--ts-hairline)" : "transparent"}`,
      }}
    >
      <nav className="mx-auto flex w-full max-w-shell items-center justify-between gap-3 px-6 py-4 sm:gap-6 sm:px-8">
        <Link to="/" className="group flex items-center" aria-label="TumorSight home">
          <span className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <LogoMark size="clamp(42px, 12vw, 50px)" />
          </span>
        </Link>

        {/*
          Responsive display lives on this wrapper, never on `.btn` itself:
          `.btn { display: inline-flex }` is authored after `@tailwind utilities`
          in index.css, so `hidden` on a button loses on source order.
        */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          <ul className="flex items-center gap-5 lg:gap-7">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className="link-underline font-display text-[0.995rem] font-medium"
                  data-active={l.end ? pathname === l.to : pathname.startsWith(l.to)}
                  style={({ isActive }) => ({
                    color: isActive ? "var(--ts-cream)" : "var(--ts-cream-3)",
                  })}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Link to="/demo" className="btn btn-primary btn-sm">
            <Crosshair size={14} strokeWidth={2.5} />
            Run Analysis
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/demo"
            className="btn btn-primary btn-sm"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.8rem" }}
          >
            <Crosshair size={13} strokeWidth={2.5} />
            Run Analysis
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-colors"
            style={{
              background: "rgba(253,247,242,.05)",
              border: "1px solid var(--ts-hairline-strong)",
              color: "var(--ts-cream)",
              cursor: "pointer",
            }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="md:hidden"
          style={{
            background: "rgba(10,22,21,.97)",
            backdropFilter: "blur(14px) saturate(140%)",
            borderTop: "1px solid var(--ts-hairline)",
          }}
        >
          <ul className="mx-auto flex w-full max-w-shell flex-col px-6 py-1 sm:px-8">
            {LINKS.map((l) => {
              const active = l.end ? pathname === l.to : pathname.startsWith(l.to);
              return (
                <li key={l.to} style={{ borderTop: "1px solid var(--ts-hairline)" }}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    onClick={() => setOpen(false)}
                    className="font-display flex items-center gap-3 py-3.5 text-[1.02rem] font-medium short:py-2.5"
                    style={{ color: active ? "var(--ts-cream)" : "var(--ts-cream-3)" }}
                  >
                    <span
                      className="inline-block h-4 w-[3px] flex-shrink-0 rounded-full"
                      style={{
                        background: active ? "var(--ts-grad-soft)" : "transparent",
                      }}
                      aria-hidden="true"
                    />
                    {l.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
