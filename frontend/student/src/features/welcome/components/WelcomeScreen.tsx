import { Image, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import AuthCtaBtn from "@/shared/components/AuthCtaBtn"
import AuthLayout from "@/shared/components/AuthLayout"

const WelcomeScreen = () => {
  const navigate = useNavigate()
  return (
    <AuthLayout>
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

      <Image src="/assets/mecque.svg" alt="Mecque illustration" my={8} mx="auto" w={{ base: "90%", md: "75%" }} />
      <VStack gap={{ base: 2, md: 3 }} flexDirection={{ base: "column", md: "row" }} justifyContent={"center"} w="full">
        <AuthCtaBtn onClick={() => navigate({ to: "/signup" })}>
          حساب جديد
        </AuthCtaBtn>

        <AuthCtaBtn onClick={() => navigate({ to: "/login" })}>
          تسجيل دخول
        </AuthCtaBtn>
      </VStack>
    </AuthLayout>
  )
}

export default WelcomeScreen
