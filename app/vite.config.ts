import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Required by @excalidraw/excalidraw when bundling with Vite.
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
});
