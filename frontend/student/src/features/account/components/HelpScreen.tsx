import { Box, Link, Text } from "@chakra-ui/react"
import { AccountPageShell } from "./AccountPageShell"

export default function HelpScreen() {
  return (
    <AccountPageShell title="المساعدة و الدعم" testId="help-screen">
      <Box dir="rtl">
        <Text
          fontSize="md"
          color="gray.700"
          lineHeight="tall"
          textAlign="right"
          mb={6}
        >
          إذا واجهت مشكلة في الدخول أو تشغيل المقررات، تواصل مع فريق الدعم
          وسنساعدك في أقرب وقت ممكن.
        </Text>
        <Text fontSize="sm" color="gray.500" mb={1} textAlign="right">
          البريد الالكتروني
        </Text>
        <Link
          href="mailto:support@example.com"
          color="brand.primary"
          fontWeight="medium"
          fontSize="lg"
          dir="ltr"
          display="block"
          textAlign="right"
          data-testid="help-email"
        >
          support@example.com
        </Link>
      </Box>
    </AccountPageShell>
  )
}
