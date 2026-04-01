import { Box, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import AuthCtaBtn from "@/shared/components/AuthCtaBtn"
import AuthInlineBtn from "@/shared/components/AuthInlineBtn"
import AuthLayout from "@/shared/components/AuthLayout"
import { CustomField } from "@/shared/components/CustomField"
import { useLoginWizard } from "../hooks/useLoginWizard"

export default function LoginScreen() {
  const {
    title,
    error,
    isSubmitting,
    email,
    setEmail,
    password,
    setPassword,
    next,
  } = useLoginWizard()

  const navigate = useNavigate()

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
        <CustomField
          label="البريد الإلكتروني"
          state={email}
          stateSetter={setEmail}
          autoComplete="email"
          type="email"
          handleKeyDownEnter={handleKeyDownEnter}
          error={error?.email}
        />
        <Box w="100%">
          <CustomField
            label="كلمة السر"
            state={password}
            stateSetter={setPassword}
            type="password"
            autoComplete="new-password"
            handleKeyDownEnter={handleKeyDownEnter}
            error={error?.password}
          />
          <AuthInlineBtn onClick={() => navigate({ to: "/forget-password" })}>
            نسيت كلمة السر؟
          </AuthInlineBtn>
        </Box>
      </VStack>
      <AuthCtaBtn onClick={next} loading={isSubmitting} disabled={isSubmitting}>
        مواصلة
      </AuthCtaBtn>
    </AuthLayout>
  )
}
