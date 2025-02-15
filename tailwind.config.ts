// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { type Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#be185d",
        secondary: "#4338ca",
      },
      borderWidth: {
        "1": "1px",
      },
    },
  },
  plugins: [
    // @ts-expect-error
    daisyui,
  ],
  daisyui: {
    themes: true, // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
} satisfies Config;
