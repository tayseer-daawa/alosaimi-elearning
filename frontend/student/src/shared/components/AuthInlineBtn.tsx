import { Button, ButtonProps } from "@chakra-ui/react"
import React from "react"

interface AuthInlineBtnProps extends ButtonProps {
    children: React.ReactNode
}

export default function AuthInlineBtn({ children, ...props }: AuthInlineBtnProps) {
    return (
        <Button
            alignSelf="self-start"
            fontSize={{ base: "sm", md: "xl", lg: "xl" }}

            fontWeight="500"
            color="text.default"
            variant="ghost"
            p={0}
            textDecoration="underline"
            {...props}
        >
            {children}
        </Button>
    )
}
