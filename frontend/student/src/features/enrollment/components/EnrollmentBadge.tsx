import { Flex, Text } from "@chakra-ui/react"
import { CircleCheck } from "lucide-react"
import type { ProgramEnrollment } from "../lib/enrollmentState"

export function EnrollmentBadge({
  status,
}: {
  status: ProgramEnrollment["status"]
}) {
  const enrolled = status === "enrolled"
  return (
    <Flex
      as="span"
      display="inline-flex"
      align="center"
      gap={1.5}
      bg={enrolled ? "brand.primary" : "brand.accent"}
      color={enrolled ? "white" : "text.default"}
      fontSize={{ base: "sm", lg: "md" }}
      fontWeight="bold"
      px={3}
      py={1}
      borderRadius="full"
      data-testid="program-enrollment-badge"
      data-status={status}
    >
      {enrolled ? <CircleCheck size={16} aria-hidden /> : null}
      <Text as="span">{enrolled ? "مسجّل" : "التسجيل مفتوح"}</Text>
    </Flex>
  )
}
