/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./popup.html",
    "./options.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // GeeksforGeeks green combined with GitHub dark
          gfg: '#2f8d46',
          gfgHover: '#216331',
          github: '#24292e',
          githubHover: '#1c1f23',
        },
        accent: {
          light: '#f6f8fa',
          border: '#d0d7de',
          textMuted: '#57606a',
          success: '#1a7f37',
          error: '#cf222e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
