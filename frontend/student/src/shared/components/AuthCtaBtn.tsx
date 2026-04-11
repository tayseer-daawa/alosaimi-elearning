import type { ButtonProps } from "@chakra-ui/react"
import { Button } from "@chakra-ui/react"

export default function AuthCtaBtn({ children, ...props }: ButtonProps) {
  return (
    <Button
      size={{ base: "sm", md: "md" }}
      w={{ base: "80%", md: "60%", lg: "50%" }}
      alignSelf="center"
      {...props}
    >
      {children}
    </Button>
  )
}
