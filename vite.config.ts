import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwind from "@tailwindcss/vite"
import pluginSnapshot from './vite-plugin-snapshot'

export default defineConfig({
  plugins: [solid(), tailwind(), pluginSnapshot()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})
