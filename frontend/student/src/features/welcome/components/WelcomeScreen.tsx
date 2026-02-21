import { Box, Button, Flex, Image, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"

const WelcomeScreen = () => {
  const navigate = useNavigate()
  return (
    <Box
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
          <VStack gap={{ base: 2, md: 3 }} pt={{ base: 4, md: 10, lg: 12 }}>
            <Text
              fontSize={{ base: "3xl", md: "5xl", lg: "5xl" }}
              fontWeight={400}
              textAlign="center"
              lineHeight={{ base: "short", md: "shorter" }}
            >
              مرحبا بك في موقع برامج الشيخ العصيمي
            </Text>
          </VStack>

          <Image src="/assets/mecque.svg" alt="Mecque illustration" />

          <Button
            size={{ base: "md", md: "lg" }}
            w={{ base: "80%", md: "60%", lg: "50%" }}
            alignSelf="center"
            onClick={() => navigate({ to: "/signup" })}
          >
            حساب جديد
          </Button>

          <Button
            size={{ base: "md", md: "lg" }}
            w={{ base: "80%", md: "60%", lg: "50%" }}
            alignSelf="center"
            onClick={() => navigate({ to: "/login" })}
          >
            تسجيل دخول
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

export default WelcomeScreen
