import AuthLayout from "@/shared/components/AuthLayout"
import AuthBtnCta from "@/shared/components/AuthBtnCta"
import { Image, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"

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

      <Image src="/assets/mecque.svg" alt="Mecque illustration" />

      <AuthBtnCta onClick={() => navigate({ to: "/signup" })}>
        حساب جديد
      </AuthBtnCta>

      <AuthBtnCta onClick={() => navigate({ to: "/login" })}>
        تسجيل دخول
      </AuthBtnCta>
    </AuthLayout>
  )
}

export default WelcomeScreen
