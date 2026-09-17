import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: './', publicDir: false, plugins: [react()], server: { host: '0.0.0.0', port: 5186, strictPort: true }, build: { outDir: 'dist-public-screen', rollupOptions: { input: 'src/public-screen/index.html' } } })
