import { createSystem, defaultConfig } from "@chakra-ui/react"

import { buttonRecipe } from "./theme/button.recipe"

const fontStack =
  "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      margin: 0,
      padding: 0,
      fontFamily: fontStack,
      color: "text.default",
      backgroundColor: "white",
      backgroundImage: "url(/assets/bg-mobile.svg)",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center top",
      backgroundSize: "cover",
      "@media (min-width: 48em)": {
        backgroundImage: "url(/assets/bg-desktop.svg)",
      },
    },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: fontStack },
        heading: { value: fontStack },
      },
      colors: {
        brand: {
          primary: { value: '#21605D' },
          secondary: { value: '#2D836E' },
          accent: { value: '#E4DB99' },
          info: { value: '#0B8CE9' },
          lightGray: { value: '#BCBCBC' },
          gray: { value: '#333333' },
          lightTeal: { value: '#C9EBE9' },
        },
        text: {
          default: { value: "#1A4D4A" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
