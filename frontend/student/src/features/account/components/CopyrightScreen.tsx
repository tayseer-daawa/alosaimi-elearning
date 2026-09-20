import { Box, Text } from "@chakra-ui/react"
import { AccountPageShell } from "./AccountPageShell"

const SECTIONS = [
  {
    title: "استخدام المعلومات المجمعة",
    body: "تُستخدم بيانات الحساب لتقديم خدمة التعلم وتحسين التجربة داخل المنصة. لا تُباع بياناتك لأطراف ثالثة لأغراض تسويقية.",
  },
  {
    title: "مشاركة المعلومات",
    body: "قد تُشارك معلومات محدودة مع مزوّدي الخدمة التقنيين اللازمين لتشغيل المنصة، وفق العقود وسياسات الخصوصية المعمول بها.",
  },
  {
    title: "المحتوى التعليمي",
    body: "المتون والشروحات والتسجيلات محمية بحقوق أصحابها. يُسمح بالاستخدام الشخصي للطلاب المسجّلين داخل المنصة، ويُمنع إعادة النشر أو التوزيع دون إذن.",
  },
] as const

export default function CopyrightScreen() {
  return (
    <AccountPageShell title="حقوق الملكية" testId="copyright-screen">
      <Box dir="rtl">
        {SECTIONS.map((section) => (
          <Box key={section.title} mb={8}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="brand.primary"
              mb={3}
              textAlign="right"
            >
              {section.title}
            </Text>
            <Text
              fontSize="md"
              color="gray.700"
              lineHeight="tall"
              textAlign="right"
            >
              {section.body}
            </Text>
          </Box>
        ))}
      </Box>
    </AccountPageShell>
  )
}
