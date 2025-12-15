import { createSystem, defaultConfig } from '@chakra-ui/react';

import { buttonRecipe } from './theme/button.recipe';

const fontStack = "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: '16px',
    },
    body: {
      margin: 0,
      padding: 0,
      fontFamily: fontStack,
      color: 'text.default',
      backgroundColor: 'white',
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
          accent: { value: '#E4DB99' },
          info: { value: '#0B8CE9' },
        },
        text: {
          default: { value: '#1A4D4A' },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
});
