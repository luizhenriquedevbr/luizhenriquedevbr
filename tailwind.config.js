/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        noite: '#0D1530',
        noite2: '#16224A',
        noite3: '#24305C',
        laranja: '#FF7A2F',
        azul: '#4C8DFF',
        moeda: '#FFC53D',
        nevoa: '#C9D3F2',
      },
      fontFamily: {
        titulo: ['Fredoka', 'sans-serif'],
        texto: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
