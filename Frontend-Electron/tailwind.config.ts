import tokens from "./src/design-tokens";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      letterSpacing: tokens.letterSpacing,
      backgroundImage: tokens.backgroundImage,
      backgroundSize: tokens.backgroundSize,
      boxShadow: tokens.boxShadow,
    },
  },
  plugins: [],
};
