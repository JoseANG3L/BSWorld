/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tu paleta personalizada basada en #390261
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',  // Color vibrante para modo oscuro
          600: '#7c3aed',  // Color principal para botones (Standard)
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#390261',  // <--- TU COLOR EXACTO (Lo usaremos para bordes fuertes o fondos activos)
          950: '#2e1065',
        },
        // Fondos neutros (sin cambios)
        dark: {
          bg: '#121212',
          surface: '#1D1D1D',
        },
        light: {
          bg: '#EEEEEE',
          surface: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}