import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react"
import { CustomField, } from "@/shared/components/CustomField"
import { useForgetPassword } from "./hooks/useForgetPassword"
import { useNavigate } from "@tanstack/react-router"


export default function ForgetPasswordScreen() {
    const {
        error,
        isSubmitting,
        email,
        setEmail,
        next,
        success,
    } = useForgetPassword()

    const handleKeyDownEnter = (e: React.KeyboardEvent) => {
        if (e.key !== "Enter") return
        e.preventDefault()
        next()
    }

    const title = "إرسال البريد الإلكتروني"

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
                            {title}
                        </Text>
                    </VStack>
                    <VStack flex="1" justify="center" w={{ base: "100%", md: "75%", lg: "65%" }} alignSelf="center"
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
                            <Text color="green.500" fontSize={{ base: "md", md: "lg" }} fontWeight="500" mt={2} textAlign="center">
                                تم إرسال البريد الإلكتروني بنجاح. يرجى التحقق من بريدك الإلكتروني.
                            </Text>
                        )}
                        <Button
                            alignSelf="self-start"
                            fontSize={{ base: "sm", md: "xl", lg: "xl" }}
                            marginTop={{
                                base: 0, md: 4, lg: 6
                            }}
                            fontWeight="500"
                            color="text.default"
                            variant="ghost"
                            p={0}
                            textDecoration="underline"
                            onClick={() => navigate({ to: "/login" })}
                        >
                            العودة إلى تسجيل الدخول
                        </Button>
                    </VStack>

                    <Button
                        size={{ base: "md", md: "md" }}
                        w={{ base: "80%", md: "60%", lg: "50%" }}
                        alignSelf="center"
                        onClick={next}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        إرسال
                    </Button>

                </Flex>
            </Box>
        </Box >
    )
}

