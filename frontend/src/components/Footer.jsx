import React from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Logo, Shell } from "./ui.jsx";

export default function Footer() {
  return (
    <footer style={{ background: "var(--ts-deep)", borderTop: "1px solid var(--ts-hairline)" }}>
      <Shell className="footer-top flex flex-col gap-6 py-8 short:py-5 md:flex-row md:items-center md:justify-between">
        <div className="footer-brand max-w-sm">
          <Logo className="footer-logo" height="clamp(52px, 15vw, 80px)" />
          <p className="footer-tagline mt-4 text-sm leading-relaxed short:mt-2.5" style={{ color: "var(--ts-cream-3)" }}>
            Educational brain tumor MRI classifier. Not a medical device or a substitute for a radiologist.
          </p>
        </div>

        {/* Landscape phones: Source column gets a bit more width so repo
            names stay on one line; portrait stacks below xs. Spacing for
            landscape is owned by index.css (Tailwind landscape: variants
            are unreliable in this build). */}
        <div className="footer-nav-grid grid grid-cols-1 gap-8 xs:grid-cols-2 sm:gap-10 md:mr-12 md:w-auto">
          <nav className="flex flex-col gap-2.5">
            <span className="t-eyebrow" style={{ color: "var(--ts-cream-3)", opacity: 0.7 }}>
              Pages
            </span>
            {[
              ["/", "Home"],
              ["/demo", "Analysis"],
              ["/about", "About"],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="link-underline w-fit text-sm"
                style={{ color: "var(--ts-cream-2)" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <nav className="footer-source-nav flex min-w-0 flex-col gap-2.5">
            <span className="t-eyebrow" style={{ color: "var(--ts-cream-3)", opacity: 0.7 }}>
              Source
            </span>
            <a
              href="https://github.com/RenadAlh"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex w-fit items-center gap-2 text-sm"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <Github size={14} className="flex-shrink-0" /> @RenadAlh
            </a>
            <a
              href="https://github.com/RenadAlh/TumorSight"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex w-fit items-center gap-2 text-sm"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <Github size={14} className="flex-shrink-0" /> TumorSight Repository
            </a>
            <a
              href="https://github.com/RenadAlh/VGG16TumorClassification"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex w-fit items-center gap-2 text-sm"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <Github size={14} className="flex-shrink-0" /> Model Search Repository
            </a>
          </nav>
        </div>
      </Shell>

      <div style={{ borderTop: "1px solid var(--ts-hairline)" }}>
        <Shell className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-5">
          <span
            className="min-w-0 max-w-full text-xs leading-snug"
            style={{ color: "var(--ts-cream-3)", opacity: 0.75 }}
          >
            © {new Date().getFullYear()} TumorSight · Built with ❤️ by Renad Alharthi
          </span>
        </Shell>
      </div>
    </footer>
  );
}
