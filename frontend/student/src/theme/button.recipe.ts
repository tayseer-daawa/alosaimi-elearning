import { defineRecipe } from "@chakra-ui/react"

// Button recipe matching the Figma design
export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "400",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4",
    transitionProperty: "common",
    transitionDuration: "200ms",
  },
  variants: {
    variant: {
      primary: {
        bg: "brand.primary",
        color: "white",
        _hover: { bg: "brand.primary", filter: "brightness(0.95)" },
        _active: { filter: "brightness(0.9)" },
      },
      secondary: {
        bg: "brand.accent",
        color: "text.default",
        _hover: { filter: "brightness(0.95)" },
        _active: { filter: "brightness(0.9)" },
      },
      info: {
        bg: "brand.info",
        color: "white",
        _hover: { filter: "brightness(0.95)" },
        _active: { filter: "brightness(0.9)" },
      },
      ghost: {
        bg: "transparent",
        color: "inherit",
        _hover: { bg: "blackAlpha.100" },
        _active: { bg: "blackAlpha.200" },
      },
    },
    size: {
      sm: {
        h: "8",
        minH: "8",
        minW: "8",
        px: "3",
        fontSize: "sm",
        borderRadius: "full",
      },
      md: {
        h: "4rem",
        px: "7",
        fontSize: "xl",
        borderRadius: "sm",
      },
      lg: {
        h: "6rem",
        px: "7",
        fontSize: "3xl",
        borderRadius: "md",
      },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})
