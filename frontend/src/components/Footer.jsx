import React from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Logo, Shell } from "./ui.jsx";

export default function Footer() {
  return (
    <footer style={{ background: "var(--ts-deep)", borderTop: "1px solid var(--ts-hairline)" }}>
      <Shell className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Logo height={80} />
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ts-cream-3)" }}>
            Educational brain tumor MRI classifier. Not a medical device or a substitute for a radiologist.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 md:mr-12">
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

          <nav className="flex flex-col gap-2.5">
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
              <Github size={14} /> @RenadAlh
            </a>
            <a
              href="https://github.com/RenadAlh/TumorSight"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex w-fit items-center gap-2 text-sm"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <Github size={14} /> TumorSight Repository
            </a>
            <a
              href="https://github.com/RenadAlh/VGG16TumorClassification"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex w-fit items-center gap-2 text-sm"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <Github size={14} /> Model Search Repository
            </a>
          </nav>
        </div>
      </Shell>

      <div style={{ borderTop: "1px solid var(--ts-hairline)" }}>
        <Shell className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="t-num text-xs" style={{ color: "var(--ts-cream-3)", opacity: 0.75 }}>
            © {new Date().getFullYear()} TumorSight · Built with ❤️ by Renad Alharthi
          </span>
          <span className="t-num text-xs" style={{ color: "var(--ts-cream-3)", opacity: 0.75 }}>
            VGG16 · 4-classes · Recall 95.48%
          </span>
        </Shell>
      </div>
    </footer>
  );
}
