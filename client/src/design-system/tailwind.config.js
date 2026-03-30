/** @type {import('tailwindcss').Config} */
const tokens = require('./tokens');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      transitionDuration: tokens.transitions,
      zIndex: tokens.zIndex,
    },
  },
  plugins: [
    // Adds default focus rings, forms base styles
    // require('@tailwindcss/forms') might be added later if needed
  ],
  // Ensures default classes required globally by the app exist
  safelist: [
    {
      pattern: /(bg|text|border)-(success|warning|danger)-/,
    }
  ]
};
