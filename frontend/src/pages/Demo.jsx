import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertTriangle,
  Check,
  Crosshair,
  Image as ImageIcon,
  Info,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

import {
  ConfidenceGauge,
  ProbabilityBars,
} from "../components/dataviz.jsx";

import {
  Band,
  CornerBrackets,
  Eyebrow,
  Shell,
} from "../components/ui.jsx";

import {
  CLASS_INFO,
  CLASS_ORDER,
} from "../theme.js";

/* ---------------------------------------------------------------------
   Mock predictor, used when the API URL field is cleared. Deterministic
   per-file so the same upload always gives the same demo result.
--------------------------------------------------------------------- */

function mockPredict(file) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let h = 0;
      const str = file.name + file.size;

      for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
      }

      const idx = h % CLASS_ORDER.length;
      const base = 0.55 + (h % 40) / 100;
      let remaining = 1 - base;

      const probs = {};

      CLASS_ORDER.forEach((c, i) => {
        probs[c] = i === idx ? base : 0;
      });

      CLASS_ORDER.forEach((c, i) => {
        if (i !== idx) {
          const share =
            remaining *
            (0.5 + ((h >> i) % 10) / 20);

          probs[c] = Math.min(
            share,
            remaining
          );

          remaining -= probs[c];
        }
      });

      probs[CLASS_ORDER[idx]] +=
        remaining > 0 ? remaining : 0;

      resolve({
        predicted_class: CLASS_ORDER[idx],
        confidence: probs[CLASS_ORDER[idx]],
        probabilities: probs,
      });
    }, 700);
  });
}

async function realPredict(file, apiUrl) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    apiUrl.replace(/\/$/, "") + "/predict",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    if (
      res.status === 422 ||
      res.status === 400
    ) {
      throw new Error(
        body?.detail ||
          "This doesn't look like a brain MRI scan."
      );
    }

    if (res.status === 429) {
      throw new Error(
        "Rate limit reached, the API allows 10 scans a minute. Try again shortly."
      );
    }

    throw new Error(
      body?.detail ||
        `The API returned ${res.status}.`
    );
  }

  return res.json();
}

const DEFAULT_API_URL =
  "https://tumorsight-api.graysand-2feb18d0.centralindia.azurecontainerapps.io";

/* ---------------------------------------------------------------------
   Detection phases
--------------------------------------------------------------------- */

const PHASES = [
  "Reading file",
  "Checking it is a grayscale MRI",
  "Resizing to 224 x 224",
  "VGG16 feature extraction",
  "Softmax over 4 classes",
];

const PHASE_MS = 620;

const MIN_SCAN_MS =
  PHASES.length * PHASE_MS;

export default function Demo() {
  const [liveApi, setLiveApi] = useState(true);

  // idle -> staged -> scanning -> done | error
  const [status, setStatus] =
    useState("idle");

  const [file, setFile] = useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [errorMsg, setErrorMsg] =
    useState("");

  const [phase, setPhase] =
    useState(0);

  const [dragging, setDragging] =
    useState(false);

  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  /* -------------------------------------------------------------------
     Object URL handling
  ------------------------------------------------------------------- */

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* -------------------------------------------------------------------
     Stage file
  ------------------------------------------------------------------- */

  const stage = useCallback((f) => {
    if (!f) return;

    clearTimers();

    setFile(f);
    setResult(null);
    setErrorMsg("");
    setPhase(0);
    setStatus("staged");
  }, []);

  /* -------------------------------------------------------------------
     Reset
  ------------------------------------------------------------------- */

  const reset = () => {
    clearTimers();

    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setErrorMsg("");
    setPhase(0);
    setStatus("idle");
  };

  /* -------------------------------------------------------------------
     Run analysis
  ------------------------------------------------------------------- */

  const run = useCallback(async () => {
    if (!file) return;

    clearTimers();

    setStatus("scanning");
    setResult(null);
    setErrorMsg("");
    setPhase(0);

    PHASES.forEach((_, i) => {
      if (i === 0) return;

      timers.current.push(
        setTimeout(
          () => setPhase(i),
          i * PHASE_MS
        )
      );
    });

    const startedAt = performance.now();

    try {
      const data = liveApi
        ? await realPredict(
            file,
            DEFAULT_API_URL
          )
        : await mockPredict(file);

      const wait = Math.max(
        0,
        MIN_SCAN_MS -
          (performance.now() -
            startedAt)
      );

      timers.current.push(
        setTimeout(() => {
          setResult(data);
          setStatus("done");
        }, wait)
      );
    } catch (err) {
      const wait = Math.max(
        0,
        900 -
          (performance.now() -
            startedAt)
      );

      timers.current.push(
        setTimeout(() => {
          setErrorMsg(err.message);
          setStatus("error");
        }, wait)
      );
    }
  }, [file, liveApi]);

  /* -------------------------------------------------------------------
     Drop
  ------------------------------------------------------------------- */

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    stage(
      e.dataTransfer.files?.[0]
    );
  };

  const scanning =
    status === "scanning";

  const info = result
    ? CLASS_INFO[
        result.predicted_class
      ]
    : null;

  return (
    <Band
      tone="canvas"
      className="overflow-hidden"
    >
      <div
        className="grid-veil pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />

      <Shell className="relative py-4 lg:py-5">

        {/* =============================================================
            HEADER
        ============================================================= */}

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div className="flex flex-col gap-3">

            <Eyebrow>
              Analysis console
            </Eyebrow>

            <h1
              className="t-h2"
              style={{
                color:
                  "var(--ts-cream)",
              }}
            >
              Load a scan, then{" "}
              <span className="grad-text">
                run the model.
              </span>
            </h1>

          </div>

          <button
            onClick={() =>
              setLiveApi((v) => !v)
            }
            className="chip transition-colors hover:border-[rgba(255,122,84,.5)]"
            style={{
              cursor: "pointer",
            }}
            title="Toggle between the live API and offline demo mode"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: liveApi
                  ? "var(--ts-aqua)"
                  : "var(--ts-coral)",
              }}
            />

            {liveApi
              ? "Live API"
              : "Demo mode"}
          </button>

        </div>

        {/* =============================================================
            PANELS
        ============================================================= */}

        <div
          className="mt-5 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,780px)_minmax(0,1fr)]"
          style={{
            height:
              "calc(100vh - 230px)",
            minHeight: "530px",
          }}
        >

          {/* ===========================================================
              PANEL A · SCAN BAY
          =========================================================== */}

          <section className="panel flex h-full w-full max-w-[780px] min-h-0 flex-col p-5 sm:p-6">

            <PanelHead
              index="A"
              title="Scan bay"
              status={
                status === "idle"
                  ? "Awaiting input"
                  : status === "staged"
                  ? "Ready"
                  : scanning
                  ? PHASES[phase]
                  : status === "error"
                  ? "Rejected"
                  : "Complete"
              }
              tone={
                status === "error"
                  ? "error"
                  : scanning
                  ? "busy"
                  : status === "done"
                  ? "ok"
                  : "idle"
              }
            />

            {/* Image well */}

            <div
              className="panel-well relative mt-4 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() =>
                setDragging(false)
              }
              onDrop={onDrop}
              style={{
                borderColor: dragging
                  ? "rgba(255,122,84,.75)"
                  : info
                  ? `${info.color}88`
                  : undefined,

                transition:
                  "border-color .3s ease, box-shadow .3s ease",

                boxShadow: dragging
                  ? "inset 0 0 0 1px rgba(255,122,84,.5), 0 0 40px -14px rgba(255,122,84,.7)"
                  : undefined,
              }}
            >

              <div
                className="grid-veil absolute inset-0 opacity-40"
                aria-hidden="true"
              />

              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Uploaded MRI scan"
                    className="relative h-full w-full object-contain transition-[filter,transform] duration-700"
                    style={{
                      filter: scanning
                        ? "contrast(1.15) saturate(0.6) brightness(0.9)"
                        : status ===
                          "done"
                        ? "contrast(1.06)"
                        : "none",

                      transform: scanning
                        ? "scale(1.015)"
                        : "none",
                    }}
                  />

                  {scanning && (
                    <ScanOverlay />
                  )}

                  {status ===
                    "done" &&
                    info && (
                      <ResultOverlay
                        info={info}
                      />
                    )}
                </>
              ) : (
                <label
                  className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-center"
                  style={{
                    color:
                      "var(--ts-cream-3)",
                  }}
                >

                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-md transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-105"
                    style={{
                      background:
                        "rgba(253,247,242,.05)",
                      border:
                        "1px dashed rgba(255,122,84,.45)",
                    }}
                  >
                    <UploadCloud
                      size={22}
                      color="var(--ts-coral)"
                    />
                  </span>

                  <span
                    className="t-h3"
                    style={{
                      color:
                        "var(--ts-cream)",
                    }}
                  >
                    Drop an MRI slice here
                  </span>

                  <span className="text-[0.85rem]">
                    or click to browse · JPG
                    or PNG
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      stage(
                        e.target.files?.[0]
                      )
                    }
                  />

                </label>
              )}

              <CornerBrackets
                inset="0.6rem"
                size="1.3rem"
                color={
                  scanning
                    ? "rgba(255,171,122,.95)"
                    : info
                    ? `${info.tint}cc`
                    : "rgba(255,171,122,.4)"
                }
              />

            </div>

            {/* File meta + controls */}

            <div className="mt-4 flex flex-col gap-3">

              {file && (
                <div
                  className="flex items-center gap-3 text-[0.78rem]"
                  style={{
                    color:
                      "var(--ts-cream-3)",
                  }}
                >
                  <ImageIcon size={14} />

                  <span
                    className="t-num truncate"
                    title={file.name}
                  >
                    {file.name}
                  </span>

                  <span className="t-num ml-auto flex-shrink-0 opacity-70">
                    {(file.size / 1024).toFixed(
                      0
                    )}{" "}
                    KB
                  </span>
                </div>
              )}

              {(scanning ||
                status === "done") && (
                <PhaseTrack
                  phase={phase}
                />
              )}

              {status === "error" && (
                <div
                  className="flex items-start gap-3 rounded-md p-3.5 text-[0.85rem] leading-relaxed"
                  style={{
                    background:
                      "rgba(125,45,92,.3)",
                    border:
                      "1px solid rgba(201,77,118,.5)",
                    color:
                      "var(--ts-cream)",
                  }}
                >
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    color="var(--ts-coral-2)"
                  />

                  <span>
                    {errorMsg}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">

                <button
                  className="btn btn-primary flex-1"
                  onClick={run}
                  disabled={
                    !file || scanning
                  }
                >
                  {scanning ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin-slow"
                      />
                      Analyzing
                    </>
                  ) : (
                    <>
                      <Crosshair
                        size={16}
                        strokeWidth={2.4}
                      />

                      {status ===
                        "done" ||
                      status ===
                        "error"
                        ? "Run again"
                        : "Run Analysis"}
                    </>
                  )}
                </button>

                {file && (
                  <button
                    className="btn btn-ghost"
                    onClick={reset}
                    disabled={scanning}
                  >
                    <X size={15} />
                    Clear
                  </button>
                )}

              </div>

            </div>

          </section>

          {/* ===========================================================
              PANEL B · ANALYSIS
          =========================================================== */}

          <section className="flex h-full w-full min-w-0 flex-col gap-4 self-stretch">

            <div className="min-h-0 flex-1">

              {status === "done" &&
              result &&
              info ? (
                <ResultsPanel
                  result={result}
                  info={info}
                />
              ) : (
                <IdlePanel
                  status={status}
                  phase={phase}
                />
              )}

            </div>

            {/* Disclaimer */}

            <div
              className="flex flex-shrink-0 items-start gap-3 rounded-md p-3.5 text-[0.8rem] leading-relaxed"
              style={{
                background:
                  "rgba(253,247,242,.035)",
                border:
                  "1px solid var(--ts-hairline)",
                color:
                  "var(--ts-cream-3)",
              }}
            >
              <Info
                size={15}
                className="mt-0.5 flex-shrink-0"
              />

              <span>
                Educational demo only, not
                a diagnostic device. The
                model classifies tumor{" "}
                <em>type</em>; it does not
                localize, grade, or rule
                anything out.
              </span>
            </div>

          </section>

        </div>

      </Shell>
    </Band>
  );
}

/* =====================================================================
   Panel Header
===================================================================== */

function PanelHead({
  index,
  title,
  status,
  tone = "idle",
}) {
  const dot = {
    idle: "var(--ts-cream-3)",
    busy: "var(--ts-coral)",
    ok: "var(--ts-aqua)",
    error: "var(--ts-rose)",
  }[tone];

  return (
    <div className="flex items-center gap-3">

      <span
        className="t-num flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm text-[0.72rem] font-bold"
        style={{
          background:
            "rgba(253,247,242,.06)",
          border:
            "1px solid var(--ts-hairline)",
          color:
            "var(--ts-coral-2)",
        }}
      >
        {index}
      </span>

      <h2
        className="t-h3 flex-shrink-0"
        style={{
          color:
            "var(--ts-cream)",
        }}
      >
        {title}
      </h2>

      <span className="ml-auto flex min-w-0 items-center gap-2">

        <span
          className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
            tone === "busy"
              ? "blink"
              : ""
          }`}
          style={{
            background: dot,
            boxShadow: `0 0 8px ${dot}`,
          }}
        />

        <span
          className="t-eyebrow hidden truncate sm:inline"
          style={{
            color:
              "var(--ts-cream-3)",
          }}
        >
          {status}
        </span>

      </span>

    </div>
  );
}

/* =====================================================================
   Scan Overlay
===================================================================== */

function ScanOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,13,12,.6), transparent 30%, transparent 70%, rgba(5,13,12,.6))",
        }}
      />

      <div className="scanline absolute inset-x-0 top-0 h-24">

        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,122,84,.22))",
          }}
        />

        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #ffd7bd, #ff7a54, #ffd7bd, transparent)",
            boxShadow:
              "0 0 18px 2px rgba(255,122,84,.85)",
          }}
        />

      </div>

      <div className="absolute inset-0 flex items-center justify-center">

        <span
          className="pulse-ring absolute h-32 w-32 rounded-full"
          style={{
            border:
              "1px solid rgba(255,171,122,.8)",
          }}
        />

        <span
          className="pulse-ring absolute h-32 w-32 rounded-full"
          style={{
            border:
              "1px solid rgba(201,77,118,.7)",
            animationDelay: "-1.2s",
          }}
        />

      </div>
    </div>
  );
}

/* =====================================================================
   Result Overlay
===================================================================== */

function ResultOverlay({ info }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 p-4"
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-2.5 rounded-full px-3.5 py-2 backdrop-blur-md"
        style={{
          width: "fit-content",
          background:
            "rgba(5,13,12,.82)",
          border: `1px solid ${info.color}`,
          animation:
            "ts-count-in .6s cubic-bezier(.16,1,.3,1) both",
        }}
      >
        <Check
          size={14}
          color={info.tint}
          strokeWidth={3}
        />

        <span
          className="t-eyebrow"
          style={{
            color: info.tint,
          }}
        >
          {info.label}
        </span>
      </div>
    </div>
  );
}

/* =====================================================================
   Phase Track
===================================================================== */

function PhaseTrack({ phase }) {
  return (
    <div className="flex flex-col gap-2.5">

      <div
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{
          background:
            "rgba(253,247,242,.08)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${
              ((phase + 1) /
                PHASES.length) *
              100
            }%`,
            background:
              "var(--ts-grad-soft)",
            transition: `width ${PHASE_MS}ms linear`,
            boxShadow:
              "0 0 12px rgba(255,122,84,.8)",
          }}
        />
      </div>

      <ul className="flex flex-col gap-1">

        {PHASES.map((p, i) => (
          <li
            key={p}
            className="t-num flex items-center gap-2 text-[0.72rem]"
            style={{
              color:
                i < phase
                  ? "var(--ts-cream-3)"
                  : i === phase
                  ? "var(--ts-coral-2)"
                  : "var(--ts-cream-3)",

              opacity:
                i > phase ? 0.32 : 1,

              transition:
                "opacity .3s ease, color .3s ease",
            }}
          >
            {i < phase ? (
              <Check
                size={11}
                strokeWidth={3}
              />
            ) : i === phase ? (
              <span className="blink">
                ▸
              </span>
            ) : (
              <span
                style={{
                  opacity: 0.5,
                }}
              >
                ·
              </span>
            )}

            {p}
          </li>
        ))}

      </ul>
    </div>
  );
}

/* =====================================================================
   Idle Analysis Panel
===================================================================== */

function IdlePanel({
  status,
  phase,
}) {
  const scanning =
    status === "scanning";

  return (
    <div className="panel h-full w-full">

      <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">

        <PanelHead
          index="B"
          title="Analysis"
          status={
            scanning
              ? "Computing"
              : status === "error"
              ? "No result"
              : "Standby"
          }
          tone={
            scanning
              ? "busy"
              : status === "error"
              ? "error"
              : "idle"
          }
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">

          <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">

            <span
              className={`absolute inset-0 rounded-full ${
                scanning
                  ? "pulse-ring"
                  : ""
              }`}
              style={{
                border:
                  "1px solid rgba(255,171,122,.4)",
              }}
            />

            <span
              className="absolute inset-3 rounded-full"
              style={{
                border:
                  "1px dashed rgba(253,247,242,.14)",
              }}
            />

            <Crosshair
              size={24}
              strokeWidth={1.6}
              color={
                scanning
                  ? "var(--ts-coral)"
                  : "var(--ts-cream-3)"
              }
              className={
                scanning
                  ? "spin-slow"
                  : ""
              }
            />

          </div>

          <div className="flex flex-col gap-1.5">

            <p
              className="t-h3"
              style={{
                color:
                  "var(--ts-cream)",
              }}
            >
              {scanning
                ? PHASES[phase]
                : "No scan analyzed yet"}
            </p>

            <p
              className="max-w-xs text-[0.86rem] leading-relaxed"
              style={{
                color:
                  "var(--ts-cream-3)",
              }}
            >
              {scanning
                ? "Hold on, the full distribution appears here the moment the model settles."
                : "Load a slice into the scan bay and hit Run Analysis. The predicted class, confidence, and all four probabilities land here."}
            </p>

          </div>

          <ul
            className="mt-1 flex w-full max-w-xs flex-col gap-2"
            aria-hidden="true"
          >
            {CLASS_ORDER.map(
              (c, i) => (
                <li
                  key={c}
                  className="grid items-center gap-3"
                  style={{
                    gridTemplateColumns:
                      "7rem 1fr",
                  }}
                >
                  <span
                    className="t-eyebrow text-left"
                    style={{
                      color:
                        "var(--ts-cream-3)",
                      opacity: 0.4,
                    }}
                  >
                    {
                      CLASS_INFO[c]
                        .label
                    }
                  </span>

                  <span
                    className="h-2.5 rounded-full"
                    style={{
                      background:
                        "rgba(253,247,242,.06)",
                      animation: scanning
                        ? `ts-blink 1.4s ${
                            i * 0.16
                          }s ease-in-out infinite`
                        : "none",
                    }}
                  />
                </li>
              )
            )}
          </ul>

        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   Results Analysis Panel
===================================================================== */

function ResultsPanel({
  result,
  info,
}) {
  const runnerUp = CLASS_ORDER.filter(
    (c) =>
      c !== result.predicted_class
  ).sort(
    (a, b) =>
      (result.probabilities?.[b] ??
        0) -
      (result.probabilities?.[a] ??
        0)
  )[0];

  const margin =
    (result.probabilities?.[
      result.predicted_class
    ] ?? 0) -
    (result.probabilities?.[
      runnerUp
    ] ?? 0);

  return (
    <div
      className="panel-edge h-full w-full"
      style={{
        animation:
          "ts-count-in .7s cubic-bezier(.16,1,.3,1) both",
      }}
    >
      <div className="panel-edge-inner flex h-full min-h-0 flex-col p-5 sm:p-6">

        <PanelHead
          index="B"
          title="Analysis"
          status="Complete"
          tone="ok"
        />

        {/* =============================================================
            MAIN RESULT
        ============================================================= */}

        <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row sm:justify-center sm:gap-8">

          {/* Larger ring, number size controlled inside ConfidenceGauge */}
          <ConfidenceGauge
            value={result.confidence}
            color={info.color}
            size={220}
          />

          <div className="flex flex-col items-center gap-2 text-center">

            <span
              className="t-eyebrow"
              style={{
                color:
                  "var(--ts-cream-3)",
              }}
            >
              Predicted class
            </span>

            <h3
              className="font-display text-[2.1rem] font-bold leading-none"
              style={{
                color: info.tint,
                letterSpacing:
                  "-0.03em",
              }}
            >
              {info.label}
            </h3>

            <p
              className="max-w-xs text-[0.86rem] leading-relaxed"
              style={{
                color:
                  "var(--ts-cream-2)",
              }}
            >
              {info.blurb}
            </p>

            <span
              className="t-num mt-1 w-fit rounded-full px-2.5 py-1 text-[0.7rem]"
              style={{
                background: `${info.color}2e`,
                border: `1px solid ${info.color}80`,
                color: info.tint,
              }}
            >
              +
              {(margin * 100).toFixed(
                1
              )}{" "}
              pts over{" "}
              {
                CLASS_INFO[
                  runnerUp
                ].label
              }
            </span>

          </div>

        </div>

        {/* =============================================================
            PROBABILITY BREAKDOWN
        ============================================================= */}

        <div
          className="mt-4 flex-shrink-0 border-t pt-3"
          style={{
            borderColor:
              "var(--ts-hairline)",
          }}
        >

          <div className="mb-2.5 flex items-center justify-between">

            <span
              className="t-eyebrow"
              style={{
                color:
                  "var(--ts-cream-3)",
              }}
            >
              Probability breakdown
            </span>

            <span
              className="t-num text-[0.68rem]"
              style={{
                color:
                  "var(--ts-cream-3)",
                opacity: 0.7,
              }}
            >
              softmax · sums to 100%
            </span>

          </div>

          <ProbabilityBars
            probabilities={
              result.probabilities
            }
            predicted={
              result.predicted_class
            }
          />

        </div>

        {/* =============================================================
            CLASS INFORMATION
        ============================================================= */}

        <div
          className="mt-2.5 flex-shrink-0 rounded-md p-3"
          style={{
            background:
              "rgba(253,247,242,.035)",
            border:
              "1px solid var(--ts-hairline)",
          }}
        >

          <span
            className="t-eyebrow"
            style={{
              color: info.tint,
            }}
          >
            About {info.label}
          </span>

          <p
            className="mt-1.5 text-[0.86rem] leading-relaxed"
            style={{
              color:
                "var(--ts-cream-2)",
            }}
          >
            {info.detail}
          </p>

        </div>

      </div>
    </div>
  );
}