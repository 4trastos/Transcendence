module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        jacquard: ['"Jacquard 12"', 'cursive'],
        sixtyfour: ['"SixtyfourConvergence-Regular-VariableFont_BLED,SCAN,XELA,YELA"', 'sans-serif'],
        tiny: ['"Tiny5-Regular"', 'monospace'],
      }
    },
  },
  plugins: [],
}
