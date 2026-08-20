import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path must match the GitHub repo name for GitHub Pages project sites
// (served at https://<username>.github.io/TumorSight/).
export default defineConfig({
  plugins: [react()],
  base: "/TumorSight/",
});
