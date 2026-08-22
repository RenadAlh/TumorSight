import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { Logo, LogoMark } from "./ui.jsx";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/demo", label: "Analysis" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-500"
      style={{
        background: scrolled ? "rgba(22, 58, 55, 0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--ts-hairline)" : "transparent"}`,
      }}
    >
      <nav className="mx-auto flex w-full max-w-shell items-center justify-between gap-6 px-6 py-4 sm:px-8">
        <Link to="/" className="group flex items-center" aria-label="TumorSight home">
          <span className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            {/* Small phones get the mark alone: the lockup's wordmark is the
                first thing to go when the nav runs out of room. */}
            <Logo height={30} className="hidden xs:block" />
            <LogoMark size={80} className="xs:hidden" />
          </span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          <ul className="flex items-center gap-5 sm:gap-7">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className="link-underline font-display text-[1.1rem] font-medium"
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

          <Link to="/demo" className="btn btn-primary hidden sm:inline-flex">
            <Crosshair size={15} strokeWidth={2.4} />
            Run Analysis
          </Link>
        </div>
      </nav>
    </header>
  );
}
