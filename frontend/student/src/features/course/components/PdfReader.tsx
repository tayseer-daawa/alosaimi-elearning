import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

type PdfReaderProps = {
  url?: string | null
  title: string
}

type FrameStatus = "loading" | "ready" | "timeout"

const LOAD_TIMEOUT_MS = 15_000

function pdfLoadTimeoutMs(): number {
  if (typeof window === "undefined") return LOAD_TIMEOUT_MS
  const override = (window as Window & { __COURSE_PDF_TIMEOUT_MS__?: number })
    .__COURSE_PDF_TIMEOUT_MS__
  return typeof override === "number" && override > 0
    ? override
    : LOAD_TIMEOUT_MS
}

export function PdfReader({ url, title }: PdfReaderProps) {
  const href = url?.trim()
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState<FrameStatus>("loading")

  useEffect(() => {
    if (!href) return
    setStatus("loading")
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "timeout" : s))
    }, pdfLoadTimeoutMs())
    return () => window.clearTimeout(timer)
  }, [href])

  if (!href) {
    return (
      <Box textAlign="center" py={10} px={4} data-testid="pdf-reader-empty">
        <Text color="brand.secondary" mb={2}>
          لا يتوفر ملف PDF لهذا الدرس.
        </Text>
        <Text fontSize="sm" color="gray.500">
          إن وُجد رابط للكتاب لاحقاً سيظهر هنا للقراءة داخل الصفحة.
        </Text>
      </Box>
    )
  }

  const retry = () => {
    setStatus("loading")
    setReloadKey((k) => k + 1)
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
      <Flex justify="flex-end" mb={3} gap={3} flexWrap="wrap">
        {status === "timeout" ? (
          <Button
            variant="ghost"
            size="sm"
            color="brand.primary"
            onClick={retry}
            data-testid="pdf-reader-retry"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </Button>
        ) : null}
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          color="brand.primary"
          fontSize="sm"
          textDecoration="underline"
          display="inline-flex"
          alignItems="center"
          gap={1}
          data-testid="pdf-reader-open-tab"
        >
          <ExternalLink size={14} />
          فتح PDF في تبويب جديد
        </Link>
      </Flex>

      {status === "timeout" ? (
        <Box
          borderWidth="1px"
          borderColor="orange.200"
          borderRadius="md"
          bg="orange.50"
          px={4}
          py={6}
          textAlign="center"
          mb={3}
          data-testid="pdf-reader-timeout"
        >
          <Text color="brand.primary" fontWeight="medium" mb={2}>
            تعذر عرض الملف داخل الصفحة
          </Text>
          <Text fontSize="sm" color="brand.secondary" mb={4}>
            قد يكون الاتصال بطيئاً، أو أن المصدر يمنع التضمين. افتح الملف في
            تبويب جديد أو أعد المحاولة.
          </Text>
          <Flex justify="center" gap={3} flexWrap="wrap">
            <Button
              size="sm"
              variant="ghost"
              color="brand.primary"
              onClick={retry}
              data-testid="pdf-reader-retry-panel"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </Button>
            <Button size="sm" asChild data-testid="pdf-reader-open-tab-panel">
              <a href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                فتح في تبويب جديد
              </a>
            </Button>
          </Flex>
        </Box>
      ) : null}

      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        bg="gray.50"
        minH={{ base: "420px", md: "560px" }}
        position="relative"
        display={status === "timeout" ? "none" : "block"}
      >
        {status === "loading" ? (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            bg="gray.50"
            zIndex={1}
            data-testid="pdf-reader-loading"
          >
            <Text color="brand.secondary" fontSize="sm">
              جاري تحميل الملف…
            </Text>
          </Flex>
        ) : null}
        <iframe
          key={reloadKey}
          src={href}
          title={`قراءة ${title}`}
          style={{ width: "100%", height: "560px", border: 0 }}
          data-testid="pdf-reader-frame"
          onLoad={() => setStatus("ready")}
        />
      </Box>
    </Box>
  )
}
