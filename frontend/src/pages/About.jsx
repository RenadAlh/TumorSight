import React from "react";
import {
  Boxes,
  Cloud,
  Github,
  Layers,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Timer,
  Braces,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { MetricDial } from "../components/dataviz.jsx";
import profilePhoto from "../assets/Profile.png";
import {
  Aurora,
  Band,
  Eyebrow,
  LogoMark,
  Reveal,
  SectionHead,
  Shell,
} from "../components/ui.jsx";
import { METRICS, PALETTE } from "../theme.js";

const ARCHITECTURE = [
  { label: "Input", detail: "224 × 224 × 3", note: "RGB image, rescaled by 1/255 to match the training pipeline exactly" },
  { label: "VGG16 Convolutional Base", detail: "13 conv layers", note: "ImageNet-pretrained, fine-tuned on the MRI set" },
  { label: "GlobalAveragePooling2D", detail: "512-d vector", note: "Flattens spatial features without a dense explosion" },
  { label: "Dense Head", detail: "ELU activated", note: "With dropout for regularisation" },
  { label: "Softmax", detail: "4 classes", note: "glioma · meningioma · pituitary · notumor" },
];

const STACK = [
  {
    icon: Layers,
    title: "Model",
    items: ["TensorFlow / Keras", "VGG16 (ImageNet weights)", "NumPy", "Pillow"],
  },
  {
    icon: Cloud,
    title: "Backend",
    items: ["FastAPI", "Uvicorn", "SlowAPI rate limiting", "Docker", "Azure Container Apps"],
  },
  {
    icon: MonitorSmartphone,
    title: "Frontend",
    items: ["React 18 + Vite", "Three.js", "Tailwind CSS", "React Router", "Vercel"],
  },
];

const FEATURES = [
  {
    icon: Boxes,
    title: "Four-way classification",
    text: "Every scan returns a full softmax over glioma, meningioma, pituitary, and no-tumor, not just the winning label.",
    accent: PALETTE.coral,
  },
  {
    icon: ShieldCheck,
    title: "Input validation",
    text: "The API validates incoming images before inference, rejecting images with meaningful color content since the model expects grayscale MRI scans.",
    accent: PALETTE.aqua,
  },
  {
    icon: Gauge,
    title: "Low-confidence rejection",
    text: "If the top class doesn't even win a majority of the probability mass, the scan is refused rather than guessed at.",
    accent: PALETTE.rose,
  },
  {
    icon: Timer,
    title: "Rate limiting",
    text: "Ten predictions per minute per IP, with CORS locked to the deployed frontend origins.",
    accent: PALETTE.magenta,
  },
  {
    icon: Eye,
    title: "Interactive 3D Brain",
    text: "Meet the brain before you meet the model. a draggable, anatomical 3D brain rendered with Three.js greets you on the landing page.",
    accent: PALETTE.coral,
  },
  {
    icon: SlidersHorizontal,
    title: "Demo mode fallback",
    text: "Toggle Demo mode on the analysis page to run deterministic mock predictions without relying on the live API.",
    accent: PALETTE.aqua,
  },
];

export default function About() {
  return (
    <>
      {/* ============================== INTRO ============================== */}
      <Band tone="canvas" className="overflow-hidden">
        <Aurora />
        <div className="grid-veil pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <Shell className="relative grid gap-10 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:py-24">
          <div className="flex flex-col gap-6">
            <Reveal>
              <Eyebrow>About the system</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="t-display" style={{ color: "var(--ts-cream)" }}>
                From Prediction to 
                <br />
                <span className="grad-text">Interaction.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="t-lead max-w-prose" style={{ color: "var(--ts-cream-2)" }}>
                TumorSight is the applied layer that brings a{" "}
                <a
                  href="https://github.com/RenadAlh/VGG16TumorClassification"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                  style={{ color: "var(--ts-coral-2)" }}
                >
                  trained VGG16-based model
                </a>
                {" "}into an interactive experience. The underlying work covers the training process, architecture experiments, and model weights, while TumorSight turns those results into something you can interact with.  
              </p>
            </Reveal>

            <Reveal delay={200} className="flex flex-wrap gap-3">
              <a
                href="https://github.com/RenadAlh/TumorSight"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <Github size={15} />
                TumorSight
                <span className="t-num text-[0.7rem]" style={{ color: "var(--ts-cream-3)" }}>
                  Project
                </span>
              </a>
              <a
                href="https://github.com/RenadAlh/VGG16TumorClassification"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <Github size={15} />
                VGG16 Brain Tumor
                <span className="t-num text-[0.7rem]" style={{ color: "var(--ts-cream-3)" }}>
                  Model
                </span>
              </a>
            </Reveal>
          </div>

          <Reveal delay={220} className="flex justify-center lg:justify-end">
            <div className="relative flex h-[460px] w-[460px] items-center justify-center lg:-translate-x-16">
              <span
                className="pulse-ring absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(255,171,122,.45)" }}
              />
              <span
                className="pulse-ring absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(201,77,118,.4)", animationDelay: "-1.2s" }}
              />
              <span
                className="absolute inset-6 rounded-full"
                style={{ border: "1px dashed rgba(253,247,242,.16)" }}
              />
              <LogoMark size={350} />
            </div>
          </Reveal>
        </Shell>
      </Band>

      {/* ============================= METRICS ============================= */}
      <Band tone="warm">
        <Shell className="py-20 lg:py-24">
          <Reveal>
            <SectionHead
              tone="warm"
              align="center"
              eyebrow="Held-out test set"
              title="How well it actually performs."
              lead="Macro-averaged across all four classes on unseen test data."
            />
          </Reveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {METRICS.map((m, i) => (
              <Reveal key={m.label} delay={i * 130}>
                <MetricDial label={m.label} value={m.value} note={m.note} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-8 flex justify-center">
            <span className="chip chip-warm">Overall test accuracy · 95.48%</span>
          </Reveal>
        </Shell>
      </Band>

      {/* =========================== ARCHITECTURE ========================== */}
      <Band tone="canvas" className="overflow-hidden">
        <Aurora className="opacity-50" />
        <Shell className="relative py-20 lg:py-24">
          <Reveal>
            <SectionHead
              eyebrow="Architecture"
              title="VGG16, fine-tuned for four classes."
              lead="A pretrained convolutional base does the seeing; a small pooled head does the deciding. Preprocessing is kept identical to the training notebook, because a mismatch there is the quietest way to lose accuracy in production."
            />
          </Reveal>

          <ol className="mt-12 flex flex-col gap-3">
            {ARCHITECTURE.map((layer, i) => (
              <Reveal key={layer.label} delay={i * 80}>
                <li className="panel panel-hover flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6">
                  <span
                    className="t-num flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm text-[0.75rem] font-bold"
                    style={{
                      background: "var(--ts-grad)",
                      color: "#24100c",
                      boxShadow: "0 8px 18px -10px rgba(255,122,84,.9)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="t-h3 sm:w-64 sm:flex-shrink-0" style={{ color: "var(--ts-cream)" }}>
                    {layer.label}
                  </span>
                  <span
                    className="t-num text-[0.78rem] sm:w-40 sm:flex-shrink-0"
                    style={{ color: "var(--ts-coral-2)" }}
                  >
                    {layer.detail}
                  </span>
                  <span className="text-[0.86rem] leading-relaxed" style={{ color: "var(--ts-cream-2)" }}>
                    {layer.note}
                  </span>
                </li>
              </Reveal>
            ))}
          </ol>
        </Shell>
      </Band>

      {/* ============================ TECH STACK =========================== */}
      <Band tone="deepest">
        <Shell className="py-20 lg:py-24">
          <Reveal>
            <SectionHead
              eyebrow="Tech stack"
              title="Two services, deployed independently."
              lead="A containerised FastAPI service holds the model on Azure; a static React bundle on Vercel talks to it over one POST endpoint."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STACK.map(({ icon: Icon, title, items }, i) => (
              <Reveal key={title} delay={i * 110}>
                <div className="panel panel-hover flex h-full flex-col gap-5 p-6">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-md"
                      style={{ background: "rgba(255,122,84,.14)", border: "1px solid rgba(255,122,84,.32)" }}
                    >
                      <Icon size={18} color="var(--ts-coral-2)" strokeWidth={2.1} />
                    </span>
                    <h3 className="t-h3" style={{ color: "var(--ts-cream)" }}>
                      {title}
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 text-[0.88rem]"
                        style={{ color: "var(--ts-cream-2)" }}
                      >
                        <span
                          className="h-1 w-1 flex-shrink-0 rounded-full"
                          style={{ background: "var(--ts-rose)" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-6">
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md p-4"
              style={{ background: "var(--ts-abyss)", border: "1px solid var(--ts-hairline)" }}
            >
              <Braces size={15} color="var(--ts-coral-2)" />
              <span className="t-num text-[0.78rem]" style={{ color: "var(--ts-cream-3)" }}>
                POST /predict
              </span>
              <span className="t-num text-[0.78rem]" style={{ color: "var(--ts-cream-3)", opacity: 0.6 }}>
                →
              </span>
              <span className="t-num text-[0.78rem]" style={{ color: "var(--ts-cream-2)" }}>
                {"{ predicted_class, confidence, probabilities }"}
              </span>
            </div>
          </Reveal>
        </Shell>
      </Band>

      {/* ============================= FEATURES ============================ */}
      <Band tone="warm">
        <Shell className="py-20 lg:py-24">
          <Reveal>
            <SectionHead
              tone="warm"
              eyebrow="System features"
              title="What is built in."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, accent }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group panel-warm panel-hover relative flex h-full flex-col gap-4 overflow-hidden p-6">
                  <span
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle, ${accent}30, transparent 72%)` }}
                    aria-hidden="true"
                  />
                  <span
                    className="t-num pointer-events-none absolute right-5 top-4 text-[2.1rem] font-bold leading-none opacity-[0.07]"
                    style={{ color: "var(--ts-ink)" }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span
                    className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105"
                    style={{
                      background: `${accent}22`,
                      border: `1px solid ${accent}55`,
                      boxShadow: `0 10px 22px -14px ${accent}`,
                    }}
                  >
                    <Icon size={20} color={accent} strokeWidth={2.1} />
                  </span>

                  <h3 className="relative t-h3" style={{ color: "var(--ts-ink)" }}>
                    {title}
                  </h3>
                  <p className="relative text-[0.88rem] leading-relaxed" style={{ color: "var(--ts-ink-2)" }}>
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Shell>
      </Band>

      {/* ====================== DISCLAIMER + DEVELOPER ===================== */}
      <Band tone="canvas" className="overflow-hidden">
        <Aurora className="opacity-60" />
        <Shell className="relative flex flex-col gap-6 py-20 lg:py-24">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(125,45,92,.34), rgba(10,22,21,.35) 62%)",
                border: "1px solid rgba(201,77,118,.42)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(201,77,118,.28), transparent 70%)" }}
                aria-hidden="true"
              />

              <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-9">
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(201,77,118,.18)",
                    border: "1px solid rgba(201,77,118,.45)",
                    boxShadow: "0 14px 30px -14px rgba(201,77,118,.9)",
                  }}
                >
                  <ShieldAlert size={28} color="var(--ts-coral-2)" strokeWidth={2} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[1.5rem] font-bold leading-tight" style={{ color: "var(--ts-cream)", letterSpacing: "-0.03em" }}>
                      Educational tool, not a diagnostic device.
                    </h2>

                  <p
                    className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed"
                    style={{ color: "var(--ts-cream-2)" }}
                  >
                    TumorSight is a personal project, not a medical device. Its outputs should not inform clinical decisions.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* developer credit */}
          <Reveal delay={120}>
            <div className="panel panel-hover relative overflow-hidden">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,122,84,.28), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
                <div className="flex items-center gap-5">
                  <img
                    src={profilePhoto}
                    alt="Renad Alharthi"
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    style={{
                      boxShadow: "0 14px 30px -14px rgba(255,122,84,.9)",
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Eyebrow>Designed &amp; built by</Eyebrow>
                    <h2 className="font-display text-[1.5rem] font-bold leading-tight" style={{ color: "var(--ts-cream)", letterSpacing: "-0.03em" }}>
                      Renad Alharthi
                    </h2>
                    <p className="text-[0.88rem]" style={{ color: "var(--ts-cream-2)" }}>
                      Artificial Intelligence Engineer · Model, API & Interface
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://github.com/RenadAlh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <Github size={16} />
                    @RenadAlh
                  </a>
                  <a
                    href="https://github.com/RenadAlh/TumorSight"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Project Repository
                  </a>
                  <a
                    href="https://github.com/RenadAlh/VGG16TumorClassification"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Model Repository
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </Shell>
      </Band>
    </>
  );
}