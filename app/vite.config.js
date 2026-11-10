import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Publicada em luizhenrique.dev.br/calculadora (o site ocupa a raiz do domínio).
  base: '/calculadora/',
  plugins: [react()],
})
