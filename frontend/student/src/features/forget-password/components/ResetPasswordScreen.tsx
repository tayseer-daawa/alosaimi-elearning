import AuthBtnCta from "@/shared/components/AuthBtnCta"
import { Text, VStack } from "@chakra-ui/react"
import { CustomField } from "@/shared/components/CustomField"
import { useResetPassword } from "../hooks/useResetPassword"
import AuthLayout from "@/shared/components/AuthLayout"

export default function ResetPasswordScreen() {
  const {
    title,
    error,
    isSubmitting,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  } = useResetPassword()

  const handleKeyDownEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    next()
  }

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
        gap={{ base: 8, md: 10, lg: 12 }}
        flex="1"
        justify="center"
        w={{ base: "100%", md: "75%", lg: "65%" }}
        alignSelf="center"
      >
        <VStack w="100%" gap={{ base: 6, md: 8 }} align="center">
          <CustomField
            label="كلمة السر"
            state={password}
            stateSetter={setPassword}
            type="password"
            autoComplete="new-password"
            handleKeyDownEnter={handleKeyDownEnter}
          />
          <CustomField
            label="تأكيد كلمة السر"
            state={confirmPassword}
            stateSetter={setConfirmPassword}
            type="password"
            autoComplete="new-password"
            handleKeyDownEnter={handleKeyDownEnter}
            error={error}
          />
        </VStack>
      </VStack>

      <AuthBtnCta onClick={next} loading={isSubmitting} disabled={isSubmitting}>
        مواصلة
      </AuthBtnCta>
    </AuthLayout>
  )
}
