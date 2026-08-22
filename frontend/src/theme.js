import * as THREE from "three";

/* ---------------------------------------------------------------------
   Palette, pulled from the TumorSight logo: a deep teal wordmark, a
   magenta-to-coral gradient brain, a glowing coral crosshair core.

   The ground is a near-black teal; panels layer on it in two families:
   teal/coral for the instrument, rose for explanation. Keep this file in
   sync with the CSS custom properties in index.css; these JS values
   exist for Three.js and for inline gradients Tailwind can't express.
--------------------------------------------------------------------- */
export const PALETTE = {
  // surfaces
  abyss: "#050d0c",
  deep: "#071110",
  canvas: "#0a1615",
  surface: "#102523",
  raised: "#163330",
  // rose-accented panel family
  sand: "#0d1c1a",
  sandCard: "#13272a",
  // ink
  cream: "#fdf7f2",
  cream2: "#bcd2ce",
  cream3: "#85a6a1",
  ink: "#fdf7f2",
  ink2: "#c3d3cf",
  // brand
  teal: "#123634",
  magenta: "#7d2d5c",
  rose: "#c94d76",
  coral: "#ff7a54",
  coralLight: "#ffab7a",
  aqua: "#57cbb6",
};

export const GRADIENT = `linear-gradient(102deg, ${PALETTE.magenta} 0%, ${PALETTE.rose} 46%, ${PALETTE.coral} 100%)`;
export const GRADIENT_SOFT = `linear-gradient(102deg, ${PALETTE.rose} 0%, ${PALETTE.coral} 100%)`;

/** Fixed class order, must match the backend's CLASS_NAMES exactly. */
export const CLASS_ORDER = ["glioma", "meningioma", "notumor", "pituitary"];

export const CLASS_INFO = {
  glioma: {
    label: "Glioma",
    color: PALETTE.magenta,
    // A lighter tint of the same hue, for text/bars on deep surfaces where
    // the base color would be too low-contrast.
    tint: "#c86ba0",
    blurb: "Arises in glial (supportive) brain tissue.",
    detail:
      "Gliomas develop from glial cells, which normally support and " +
      "protect neurons. They vary widely in growth rate and severity " +
      "depending on grade, and are among the most common primary brain " +
      "tumors.",
    // Illustrative marker position only; the model classifies type, not location.
    pos: new THREE.Vector3(0.55, 0.25, 0.35),
  },
  meningioma: {
    label: "Meningioma",
    color: PALETTE.rose,
    tint: "#e784a5",
    blurb: "Arises in the membranes surrounding the brain.",
    detail:
      "Meningiomas form in the meninges, the layered membranes that " +
      "cushion the brain and spinal cord. Most are slow-growing and " +
      "non-cancerous, though location can still make them clinically " +
      "significant.",
    pos: new THREE.Vector3(-0.5, 0.1, 0.55),
  },
  notumor: {
    label: "No Tumor",
    color: PALETTE.aqua,
    tint: "#7fdcca",
    blurb: "No tumor pattern detected in the scan.",
    detail:
      "The scan doesn't match the visual patterns associated with the " +
      "three tumor types this model was trained on.",
    pos: new THREE.Vector3(0, 0.85, 0),
  },
  pituitary: {
    label: "Pituitary",
    color: PALETTE.coral,
    tint: "#ffab7a",
    blurb: "An abnormal growth in the pituitary gland.",
    detail:
      "Pituitary tumors form in the pea-sized gland at the brain's base " +
      "that regulates hormones. Many are benign adenomas, but they can " +
      "still disrupt hormonal balance depending on size and type.",
    pos: new THREE.Vector3(0.0, -0.75, 0.35),
  },
};

/** Held-out test-set metrics from the VGG16TumorClassification notebook. */
export const METRICS = [
  { label: "Precision", value: 95.54, note: "Of the scans it flags for a class, how many belong there." },
  { label: "Recall", value: 95.48, note: "Of the scans in a class, how many it successfully finds." },
  { label: "F1-score", value: 95.45, note: "The harmonic mean, the single headline number." },
];
