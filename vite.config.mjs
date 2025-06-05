import { defineConfig } from "vite";
import { gadget } from "gadget-server/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [gadget(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
    },
  },
  // // Only use this to debug production frontend errors (React Minified, etc.)
  // build: {
  //   sourcemap: true,
  //   minify: false
  // },
  // define: { 'process.env.NODE_ENV': JSON.stringify('development') }
});
