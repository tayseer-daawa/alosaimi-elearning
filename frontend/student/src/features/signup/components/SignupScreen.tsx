import { Box, Button, Field, Flex, Text, VStack } from "@chakra-ui/react"
import { CustomField, ErrorText } from "@/shared/components/CustomField"
import { useSignupWizard } from "../hooks/useSignupWizard"
import { YesNoToggle } from "./YesNoToggle"

export default function SignupScreen() {
  const {
    step,
    title,
    error,
    isSubmitting,
    fullName,
    setFullName,
    email,
    setEmail,
    wantsNotifications,
    setWantsNotifications,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  } = useSignupWizard()

  const handleKeyDownEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    next()
  }

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
            {step === "name" && (
              <CustomField
                label="الاسم الكامل"
                state={fullName}
                stateSetter={setFullName}
                autoComplete="name"
                handleKeyDownEnter={handleKeyDownEnter}
                error={error}
              />
            )}

            {step === "email" && (
              <CustomField
                label="البريد الإلكتروني"
                state={email}
                stateSetter={setEmail}
                autoComplete="email"
                type="email"
                handleKeyDownEnter={handleKeyDownEnter}
                error={error}
              />
            )}

            {step === "goal" && (
              <Field.Root invalid={!!error} required gap={{ base: 3, md: 4 }}>
                <Field.Label
                  fontSize={{ base: "md", md: "xl", lg: "xl" }}
                  color="text.default"
                >
                  {"هل تريد تلقي بعض الاشعارات على البريد الالكتروني؟"}
                  <Field.RequiredIndicator />
                </Field.Label>
                <YesNoToggle
                  value={wantsNotifications}
                  onChange={setWantsNotifications}
                />

                <ErrorText error={error} />
              </Field.Root>
            )}

            {step === "password" && (
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
            )}
          </VStack>

          <Button
            size={{ base: "md", md: "md" }}
            w={{ base: "80%", md: "60%", lg: "50%" }}
            alignSelf="center"
            onClick={next}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            مواصلة
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
