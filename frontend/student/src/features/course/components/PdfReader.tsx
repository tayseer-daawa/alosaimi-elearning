import { Box, Flex, Link, Text } from "@chakra-ui/react"

type PdfReaderProps = {
  url?: string | null
  title: string
}

export function PdfReader({ url, title }: PdfReaderProps) {
  const href = url?.trim()

  if (!href) {
    return (
      <Text
        color="brand.secondary"
        textAlign="center"
        py={10}
        data-testid="pdf-reader-empty"
      >
        لا يتوفر ملف PDF لهذا الدرس.
      </Text>
    )
  }

  return (
    <Box
      data-testid="pdf-reader"
      onMouseDown={(event) => {
        // Clicks on the chrome around the iframe (not inside it) restore page-level shortcuts.
        if (
          event.target instanceof HTMLElement &&
          event.target.tagName !== "IFRAME" &&
          document.activeElement instanceof HTMLIFrameElement
        ) {
          document.activeElement.blur()
        }
      }}
    >
      <Flex justify="flex-end" mb={3}>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          color="brand.primary"
          fontSize="sm"
          textDecoration="underline"
        >
          فتح PDF في تبويب جديد
        </Link>
      </Flex>
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        bg="gray.50"
        minH={{ base: "420px", md: "560px" }}
      >
        <iframe
          src={href}
          title={`قراءة ${title}`}
          style={{ width: "100%", height: "560px", border: 0 }}
          data-testid="pdf-reader-frame"
        />
      </Box>
    </Box>
  )
}
