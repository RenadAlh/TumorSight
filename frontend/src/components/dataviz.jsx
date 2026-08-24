import React, { useEffect, useRef, useState } from "react";
import { CLASS_INFO, CLASS_ORDER, PALETTE } from "../theme.js";

/* ---------------------------------------------------------------------
   Count-up hook
   Kept internal to this file so Fast Refresh only sees component exports.
--------------------------------------------------------------------- */
function useCountUp(target, duration = 1100, deps = []) {
  const [value, setValue] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduce) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);

      setValue(from + (target - from) * eased);

      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);

    const settle = setTimeout(() => {
      setValue(target);
    }, duration + 60);

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps]);

  return value;
}

/* =====================================================================
   ConfidenceGauge
   270-degree confidence ring.

   IMPORTANT:
   - The ring can be made larger through `size`.
   - The percentage number does NOT scale with `size`.
   - The "Confidence" label also stays the same size.
   ===================================================================== */
export function ConfidenceGauge({
  value = 0,
  size = 208,
  stroke = 13,
  color = PALETTE.coral,
  label = "Confidence",
}) {
  const id = React.useId();
  const animated = useCountUp(value, 1200, [value]);

  const r = (size - stroke) / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;

  const SWEEP = 270;
  const START = 135;

  const polar = (deg) => {
    const rad = (deg * Math.PI) / 180;

    return [
      cx + r * Math.cos(rad),
      cy + r * Math.sin(rad),
    ];
  };

  const arcPath = (fromDeg, toDeg) => {
    const [x1, y1] = polar(fromDeg);
    const [x2, y2] = polar(toDeg);

    const large =
      Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const end =
    START +
    SWEEP *
      Math.min(
        1,
        Math.max(0, animated)
      );

  const pct = (animated * 100).toFixed(1);

  return (
    <div
      className="relative inline-flex flex-shrink-0 items-center justify-center"
      style={{
        width: size,
        maxWidth: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label} ${pct}%`}
      >
        <defs>
          <linearGradient
            id={`${id}-g`}
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor={PALETTE.magenta}
            />

            <stop
              offset="52%"
              stopColor={PALETTE.rose}
            />

            <stop
              offset="100%"
              stopColor={color}
            />
          </linearGradient>

          <filter
            id={`${id}-glow`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur
              stdDeviation="5"
              result="b"
            />

            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Graduation ticks */}
        <g opacity="0.5">
          {Array.from({ length: 11 }).map(
            (_, i) => {
              const deg =
                START +
                (SWEEP * i) / 10;

              const rad =
                (deg * Math.PI) / 180;

              const inner =
                r + stroke / 2 + 3;

              const outer =
                inner +
                (i % 5 === 0 ? 7 : 4);

              return (
                <line
                  key={i}
                  x1={
                    cx +
                    inner *
                      Math.cos(rad)
                  }
                  y1={
                    cy +
                    inner *
                      Math.sin(rad)
                  }
                  x2={
                    cx +
                    outer *
                      Math.cos(rad)
                  }
                  y2={
                    cy +
                    outer *
                      Math.sin(rad)
                  }
                  stroke="var(--ts-cream-3)"
                  strokeOpacity={
                    i % 5 === 0
                      ? 0.6
                      : 0.28
                  }
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              );
            }
          )}
        </g>

        {/* Background ring */}
        <path
          d={arcPath(
            START,
            START + SWEEP
          )}
          fill="none"
          stroke="rgba(253,247,242,0.09)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Progress ring */}
        {animated > 0.004 && (
          <path
            d={arcPath(START, end)}
            fill="none"
            stroke={`url(#${id}-g)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            filter={`url(#${id}-glow)`}
          />
        )}
      </svg>

      {/* =============================================================
          CENTER CONTENT

          These font sizes are intentionally FIXED.

          Increasing `size` will make the ring larger but will NOT
          increase the confidence number.
      ============================================================= */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="t-num font-bold leading-none"
          style={{
            fontSize: "2.6rem",
            color: "var(--ts-cream)",
          }}
        >
          {pct}

          <span
            style={{
              fontSize: "1.15rem",
              color: "var(--ts-cream-3)",
            }}
          >
            %
          </span>
        </span>

        <span
          className="t-eyebrow mt-2"
          style={{
            color: "var(--ts-cream-3)",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/* =====================================================================
   ProbabilityBars
   ===================================================================== */
export function ProbabilityBars({
  probabilities = {},
  predicted,
  tone = "deep",
}) {
  const warm = tone === "warm";

  const sortedKeys = [...CLASS_ORDER].sort(
    (a, b) =>
      (probabilities?.[b] ?? 0) -
      (probabilities?.[a] ?? 0)
  );

  return (
    <ul className="flex flex-col gap-3.5">
      {sortedKeys.map((key, i) => {
        const info = CLASS_INFO[key];

        const p =
          probabilities?.[key] ?? 0;

        const isTop =
          key === predicted;

        return (
          <ProbRow
            key={key}
            info={info}
            value={p}
            isTop={isTop}
            delay={i * 110}
            warm={warm}
          />
        );
      })}
    </ul>
  );
}

/* =====================================================================
   Probability row
   ===================================================================== */
function ProbRow({
  info,
  value,
  isTop,
  delay,
  warm,
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => setArmed(true),
      delay + 60
    );

    return () => clearTimeout(t);
  }, [delay]);

  const pct = value * 100;

  const accent = warm
    ? info.color
    : info.tint;

  return (
    <li
      className="grid items-center gap-x-3"
      style={{
        gridTemplateColumns:
          "clamp(5.5rem, 26vw, 7.5rem) minmax(0, 1fr) 3.6rem",
        opacity: isTop ? 1 : 0.72,
      }}
    >
      <span
        className="t-eyebrow truncate"
        style={{
          color: isTop
            ? accent
            : warm
            ? "var(--ts-ink-2)"
            : "var(--ts-cream-3)",
        }}
      >
        {info.label}
      </span>

      <span
        className="relative block h-2.5 w-full overflow-hidden rounded-full"
        style={{
          background: warm
            ? "rgba(201,77,118,.14)"
            : "rgba(253,247,242,.08)",
        }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: armed
              ? `${Math.max(
                  pct,
                  value > 0 ? 1.5 : 0
                )}%`
              : "0%",

            background: `linear-gradient(90deg, ${info.color}, ${accent})`,

            boxShadow: isTop
              ? `0 0 16px -2px ${info.color}`
              : "none",

            transition:
              "width 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </span>

      <span
        className="t-num text-right text-[0.82rem]"
        style={{
          color: isTop
            ? warm
              ? "var(--ts-ink)"
              : "var(--ts-cream)"
            : warm
            ? "var(--ts-ink-2)"
            : "var(--ts-cream-3)",

          fontWeight: isTop
            ? 700
            : 400,
        }}
      >
        {pct < 0.1 && pct > 0
          ? "<0.1"
          : pct.toFixed(1)}
        %
      </span>
    </li>
  );
}

/* =====================================================================
   MetricDial
   ===================================================================== */
export function MetricDial({
  label,
  value,
  note,
}) {
  const animated = useCountUp(
    value,
    1400,
    [value]
  );

  const id = React.useId();

  const size = 132;
  const stroke = 9;

  const r =
    (size - stroke) / 2 - 2;

  const c = 2 * Math.PI * r;

  const zoom = Math.min(
    1,
    Math.max(0, animated / 100)
  );

  return (
    <div className="panel-warm panel-hover flex h-full flex-col items-center gap-4 p-7 text-center max-lg:landscape:gap-3 max-lg:landscape:p-4">
      <div
        className="relative flex-shrink-0"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          <defs>
            <linearGradient
              id={`${id}-m`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={PALETTE.magenta}
              />

              <stop
                offset="100%"
                stopColor={PALETTE.coral}
              />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(253,247,242,.09)"
            strokeWidth={stroke}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${id}-m)`}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={
              c * (1 - zoom)
            }
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="t-num text-[1.6rem] font-bold leading-none"
            style={{
              color: "var(--ts-ink)",
            }}
          >
            {animated
              .toFixed(2)
              .padStart(5, "0")}

            <span
              style={{
                fontSize: "1rem",
              }}
            >
              %
            </span>
          </span>
        </div>
      </div>

      <div className="mt-auto flex min-h-[3.25rem] flex-col justify-start max-lg:landscape:min-h-[2.75rem]">
        <div
          className="t-h3"
          style={{
            color: "var(--ts-ink)",
          }}
        >
          {label}
        </div>

        <p
          className="mt-1.5 text-[0.83rem] leading-relaxed max-lg:landscape:mt-1 max-lg:landscape:line-clamp-2 max-lg:landscape:text-[0.75rem]"
          style={{
            color:
              "var(--ts-ink-2)",
          }}
        >
          {note}
        </p>
      </div>
    </div>
  );
}