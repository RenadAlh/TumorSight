import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // .glb isn't one of Vite's built-in asset extensions, so without this the
  // brain model import resolves as a module instead of a URL.
  assetsInclude: ["**/*.glb"],
});
