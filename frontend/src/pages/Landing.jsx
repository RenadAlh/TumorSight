import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Crosshair,
  UploadCloud,
  Cpu,
  BarChart3,
  RotateCw,
  ShieldAlert,
  Github,
} from "lucide-react";
import BrainScene from "../components/BrainScene.jsx";
import { Aurora, Band, CornerBrackets, Eyebrow, Reveal, SectionHead, Shell } from "../components/ui.jsx";
import { CLASS_INFO, CLASS_ORDER, METRICS } from "../theme.js";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload a scan",
    body:
      "Drop in a single axial MRI slice as a JPG or PNG. The System first checks that the image is a valid scan before analysis begins.",
    tag: "01 · Input",
  },
  {
    icon: Cpu,
    title: "The model reads it",
    body:
      "The slice is resized, rescaled, and passed through the model. The scan bay stays live throughout, so you can watch the prediction take shape.",
    tag: "02 · Inference",
  },
  {
    icon: BarChart3,
    title: "Get the full picture",
    body:
      "See the predicted class, confidence score, and full probability breakdown across all four classes, so every prediction comes with context.",
    tag: "03 · Result",
  },
];

export default function Landing() {
  return (
    <>
      {/* ============================== HERO ============================== */}
      <Band tone="canvas" className="overflow-hidden">
        <Aurora />
        <div className="grid-veil pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden="true" />

        <Shell className="relative grid items-center gap-8 pb-14 pt-10 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:pb-16 lg:pt-12">
          {/* ---- copy ---- */}
          <div className="flex flex-col items-start gap-5">
            <Reveal>
              <Eyebrow>VGG16 · 4-Class Brain MRI Tumor Classifier</Eyebrow>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="t-display" style={{ color: "var(--ts-cream)" }}>
                Bringing Brain Tumors Into
                <span className="grad-text"> Sight.</span>
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="t-lead max-w-prose" style={{ color: "var(--ts-cream-2)" }}>
                TumorSight turns a brain MRI slice into an interpretable prediction, identifying whether it shows glioma, meningioma, pituitary tumor, or no tumor, 
                with the confidence behind the call laid out in full, never
                reduced to a single label.
              </p>
            </Reveal>

            <Reveal delay={250} className="flex flex-wrap items-center gap-3">
              <Link to="/demo" className="btn btn-primary">
                <Crosshair size={17} strokeWidth={2.4} />
                Run Analysis
              </Link>
              <a href="#how-it-works" className="btn btn-ghost">
                How it works
                <ArrowRight size={16} />
              </a>
            </Reveal>

            <Reveal delay={330} className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-2">
              {[
                ["95.48%", "Recall"],
                ["4", "Classes"],
                ["1", "MRI → Diagnosis"],
              ].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <span className="t-num text-lg font-bold" style={{ color: "var(--ts-coral-2)" }}>
                    {v}
                  </span>
                  <span className="t-eyebrow" style={{ color: "var(--ts-cream-3)" }}>
                    {l}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>

          {/* ---- focal scan bay ---- */}
          <Reveal delay={200} className="relative">
            <div className="panel relative aspect-square w-full overflow-hidden sm:aspect-[5/4] lg:aspect-square">
              <div className="grid-veil absolute inset-0 opacity-70" aria-hidden="true" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 46%, rgba(255,122,84,.20), transparent 62%)",
                }}
                aria-hidden="true"
              />

              <BrainScene interactive className="absolute inset-0" />

              {/* corner brackets: the "instrument" framing */}
              <CornerBrackets />

              <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2">
                <span className="chip">
                  <span
                    className="blink inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--ts-aqua)" }}
                  />
                  Live
                </span>
              </div>

              <div className="pointer-events-none absolute bottom-5 left-5">
                <span className="chip">
                  <RotateCw size={12} /> Drag to rotate
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-5 right-5">
                <span className="t-num text-[0.68rem]" style={{ color: "var(--ts-cream-3)", opacity: 0.75 }}>
                  ref/brain · idle
                </span>
              </div>
            </div>
          </Reveal>
        </Shell>
      </Band>

      {/* ========================= METRIC STRIP ========================== */}
      <Band tone="deepest">
        <Shell>
          <div className="grid divide-y divide-[rgba(253,247,242,0.1)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {METRICS.map((m, i) => (
              <Reveal
                key={m.label}
                delay={i * 90}
                className="flex flex-col gap-1 py-5 sm:px-8 sm:first:pl-0 sm:last:pr-0"
              >
                <span className="t-num text-[1.7rem] font-bold leading-none grad-text">
                  {m.value.toFixed(2)}%
                </span>
                <span className="t-eyebrow" style={{ color: "var(--ts-cream-3)" }}>
                  {m.label}
                </span>
              </Reveal>
            ))}
          </div>
        </Shell>
      </Band>

      {/* ========================== HOW TO USE =========================== */}
      <Band tone="warm" id="how-it-works" className="overflow-hidden">
        <Shell className="py-14 lg:py-20">
          <Reveal>
            <SectionHead
              tone="warm"
              eyebrow="How to use it"
              title="Your scan, explained."
              lead="No account, no setup. A single image goes in and a full analysis comes back."
            />
          </Reveal>

          <div className="relative mt-10 grid gap-6 md:grid-cols-3">
            {/* connective thread between the steps */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-[3.4rem] hidden md:block"
              style={{
                height: 1,
                background:
                  "repeating-linear-gradient(90deg, rgba(201,77,118,.5) 0 7px, transparent 7px 15px)",
              }}
              aria-hidden="true"
            />

            {STEPS.map(({ icon: Icon, title, body, tag }, i) => (
              <Reveal key={title} delay={i * 120}>
                <article className="panel-warm panel-hover relative flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-md"
                      style={{
                        background: "var(--ts-grad)",
                        boxShadow: "0 10px 22px -12px rgba(255,122,84,.9)",
                      }}
                    >
                      <Icon size={19} strokeWidth={2.2} color="#fff6ef" />
                    </span>
                    <span className="t-eyebrow" style={{ color: "var(--ts-ink-2)", opacity: 0.75 }}>
                      {tag}
                    </span>
                  </div>
                  <h3 className="t-h3" style={{ color: "var(--ts-ink)" }}>
                    {title}
                  </h3>
                  <p className="text-[0.92rem] leading-relaxed" style={{ color: "var(--ts-ink-2)" }}>
                    {body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={180} className="mt-8 flex justify-center">
            <Link to="/demo" className="btn btn-warm">
              <Crosshair size={16} strokeWidth={2.4} />
              Run Analysis
            </Link>
          </Reveal>
        </Shell>
      </Band>

      {/* ======================== WHAT IT SEPARATES ======================= */}
      <Band tone="canvas" className="overflow-hidden">
        <Aurora className="opacity-60" />
        <Shell className="relative py-14 lg:py-20">
          <Reveal>
            <SectionHead
              eyebrow="The four classes"
              title="What the model is actually separating."
              lead="Each prediction is a distribution over these four labels, the winner is just the tallest bar, and the rest are worth reading too."
            />
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {CLASS_ORDER.map((key, i) => {
              const info = CLASS_INFO[key];
              return (
                <Reveal key={key} delay={i * 90}>
                  <article className="panel panel-hover flex h-full gap-5 p-6">
                    <span
                      className="mt-1 h-full w-[3px] flex-shrink-0 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${info.color}, ${info.tint})`,
                        boxShadow: `0 0 14px -1px ${info.color}`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="t-h3" style={{ color: "var(--ts-cream)" }}>
                          {info.label}
                        </h3>
                        <span className="t-num text-[0.68rem]" style={{ color: info.tint, opacity: 0.9 }}>
                          {key}
                        </span>
                      </div>
                      <p className="text-[0.92rem] leading-relaxed" style={{ color: "var(--ts-cream-2)" }}>
                        {info.detail}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Shell>
      </Band>

      {/* =========================== DISCLAIMER ========================== */}
<Band tone="deepest">
  <Shell className="py-8 lg:py-10">
    <Reveal>
      <div
        className="relative overflow-hidden rounded-lg p-4 sm:p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(125,45,92,.34), rgba(10,22,21,.35) 62%)",
          border: "1px solid rgba(201,77,118,.42)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,77,118,.35), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-4">
          {/* Warning icon */}
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md"
            style={{
              background: "rgba(201,77,118,.18)",
              border: "1px solid rgba(201,77,118,.45)",
              boxShadow: "0 0 40px rgba(201,77,118,.12)",
            }}
          >
            <ShieldAlert
              size={26}
              color="var(--ts-coral-2)"
              strokeWidth={2}
            />
          </div>

          {/* Disclaimer content */}
          <div className="min-w-0 flex-1">
            <Eyebrow>Disclaimer</Eyebrow>

            <h2
              className="t-h3 mt-1"
              style={{ color: "var(--ts-cream)" }}
            >
              This is an educational tool, not a diagnostic device.
            </h2>

            <ul
              className="mt-2 flex max-w-5xl flex-col gap-1 text-[0.8rem] leading-snug"
              style={{ color: "var(--ts-cream-2)" }}
            >
              <li className="flex gap-2.5">
                <span
                  className="mt-[0.5rem] h-1 w-1 flex-shrink-0 rounded-full"
                  style={{ background: "var(--ts-coral)" }}
                />
                <span>
                  TumorSight is a personal project. It is not registered,
                  cleared, or approved as a medical device by any regulator.
                </span>
              </li>

              <li className="flex gap-2.5">
                <span
                  className="mt-[0.5rem] h-1 w-1 flex-shrink-0 rounded-full"
                  style={{ background: "var(--ts-coral)" }}
                />
                <span>
                  The model predicts tumor type and is not intended for clinical decision-making.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  </Shell>
</Band>

      {/* ============================ CLOSING ============================ */}
<Band tone="canvas" className="overflow-hidden">
  <Aurora className="opacity-70" />
  <Shell className="relative flex flex-col items-center gap-5 py-16 text-center">
    <Reveal>
      <Eyebrow>Ready when you are</Eyebrow>
    </Reveal>

    <Reveal delay={80}>
      <h2
        className="t-h2 max-w-2xl"
        style={{ color: "var(--ts-cream)" }}
      >
        Load a scan and watch it <span className="grad-text">resolve.</span>
      </h2>
    </Reveal>

    <Reveal delay={160} className="flex flex-wrap justify-center gap-3">
      <Link to="/demo" className="btn btn-primary">
        <Crosshair size={17} strokeWidth={2.4} />
        Run Analysis
      </Link>
    </Reveal>
  </Shell>
</Band>
    </>
  );
}
