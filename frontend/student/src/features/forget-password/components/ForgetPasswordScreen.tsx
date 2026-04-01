import AuthCtaBtn from "@/shared/components/AuthCtaBtn"
import AuthInlineBtn from "@/shared/components/AuthInlineBtn"
import { Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { CustomField } from "@/shared/components/CustomField"
import { useForgetPassword } from "../hooks/useForgetPassword"
import AuthLayout from "@/shared/components/AuthLayout"

export default function ForgetPasswordScreen() {
  const { error, isSubmitting, email, setEmail, next, success } =
    useForgetPassword()

  const handleKeyDownEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    next()
  }

  const title = "إرسال البريد الإلكتروني"

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
          {title}
        </Text>
      </VStack>
      <VStack
        flex="1"
        justify="center"
        w={{ base: "100%", md: "75%", lg: "65%" }}
        alignSelf="center"
      >
        <CustomField
          label="البريد الإلكتروني"
          state={email}
          stateSetter={setEmail}
          autoComplete="email"
          type="email"
          handleKeyDownEnter={handleKeyDownEnter}
          error={error}
        />
        {success && (
          <Text
            color="green.500"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="500"
            mt={2}
            textAlign="center"
          >
            تم إرسال البريد الإلكتروني بنجاح. يرجى التحقق من بريدك
            الإلكتروني.
          </Text>
        )}
        <AuthInlineBtn onClick={() => navigate({ to: "/" })}>
          العودة إلى تسجيل الدخول
        </AuthInlineBtn>
      </VStack>

      <AuthCtaBtn onClick={next} loading={isSubmitting} disabled={isSubmitting}>
        إرسال
      </AuthCtaBtn>
    </AuthLayout>
  )
}
