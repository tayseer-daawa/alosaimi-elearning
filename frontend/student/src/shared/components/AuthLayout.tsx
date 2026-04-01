import { Box, Flex, } from "@chakra-ui/react"

const AuthLayout = ({ children }) => {
    return <Box
        dir="rtl"
        h="100vh"
        p={{ base: "calc(5rem + 3vh) 2.5rem calc(3rem + 1vh)", md: 16, lg: 20 }} //Magic numbers are calculated from figma to fit different mobile heights
    >
        <Box
            p={0}
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Flex
                h="100%"
                direction="column"
                gap="auto"
                justifyContent={"space-between"}
                w={{ base: "100%", md: "80%", lg: "60%" }}
            >
                {children}
            </Flex>
        </Box>
    </Box>
};

export default AuthLayout;