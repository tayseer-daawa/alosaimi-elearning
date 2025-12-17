import { defineRecipe } from '@chakra-ui/react';

// Button recipe matching the Figma design
export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: '600',
    borderRadius: 'md',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    transitionProperty: 'common',
    transitionDuration: '200ms',
  },
  variants: {
    variant: {
      primary: {
        bg: 'brand.primary',
        color: 'white',
        _hover: { bg: 'brand.primary', filter: 'brightness(0.95)' },
        _active: { filter: 'brightness(0.9)' },
      },
      secondary: {
        bg: 'brand.accent',
        color: 'text.default',
        _hover: { filter: 'brightness(0.95)' },
        _active: { filter: 'brightness(0.9)' },
      },
      info: {
        bg: 'brand.info',
        color: 'white',
        _hover: { filter: 'brightness(0.95)' },
        _active: { filter: 'brightness(0.9)' },
      },
    },
    size: {
      sm: {
        h: '9',
        px: '4',
        fontSize: 'sm',
      },
      md: {
        h: '11',
        px: '6',
        fontSize: 'md',
      },
      lg: {
        h: '12',
        px: '7',
        fontSize: 'lg',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
