import { Field, Input, type InputProps } from "@chakra-ui/react"

const CustomField = ({
  label,
  state,
  stateSetter,
  handleKeyDownEnter,
  error,
  ...props //input props
}: {
  label: string
  state: string
  stateSetter: (value: string) => void
  handleKeyDownEnter?: (e: React.KeyboardEvent) => void
  error?: string | null
} & Omit<InputProps, "value" | "onChange">) => {
  return (
    <Field.Root
      invalid={!!error}
      required
      gap={{ base: 3, md: 4 }}
    >
      <Field.Label
        fontSize={{ base: "sm", md: "2xl", lg: "3xl" }}
        fontWeight="500"
        color="text.default"
      >
        {label} <Field.RequiredIndicator />
      </Field.Label>
      <Input
        size={{ base: "md", lg: "lg" }}
        fontSize={{ base: "xl", md: "5xl", lg: "5xl" }}
        fontWeight={600}
        variant="flushed"
        onChange={(e) => stateSetter(e.target.value)}
        onKeyDown={handleKeyDownEnter}
        placeholder=""
        borderBottomWidth={{ base: "2px", md: "3px", lg: "4px" }}
        _focus={{ borderColor: "brand.primary", borderBottomWidth: "3px" }}
        height={{ base: "3.25rem", md: 32, lg: 24 }}
        {...props}
      />
      <ErrorText error={error} />
    </Field.Root>
  )
}

const ErrorText = ({ error }: { error?: string | null }) => {
  return (
    <Field.ErrorText
      fontSize={{ base: "md", md: "2xl", lg: "3xl" }}
      lineHeight={{ base: "short", md: "shorter" }}
      color="red.500"
      textAlign="start"
      w="100%"
    >
      {error}
    </Field.ErrorText>
  )
}

export { CustomField, ErrorText }
