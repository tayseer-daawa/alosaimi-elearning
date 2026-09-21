import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type PdfReaderProps = {
  url?: string | null
  title: string
  /** Called when focus enters/leaves the PDF iframe (for shortcut hints). */
  onIframeFocusChange?: (focused: boolean) => void
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

export function PdfReader({ url, title, onIframeFocusChange }: PdfReaderProps) {
  const href = url?.trim()
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState<FrameStatus>("loading")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const onFocusChangeRef = useRef(onIframeFocusChange)

  useEffect(() => {
    onFocusChangeRef.current = onIframeFocusChange
  }, [onIframeFocusChange])

  useEffect(() => {
    if (!href) return
    setStatus("loading")
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "timeout" : s))
    }, pdfLoadTimeoutMs())
    return () => window.clearTimeout(timer)
  }, [href])

  // Detect when the PDF iframe holds focus (cross-origin: window blur + activeElement).
  useEffect(() => {
    if (!href) {
      onFocusChangeRef.current?.(false)
      return
    }
    const report = () => {
      const focused = document.activeElement === iframeRef.current
      onFocusChangeRef.current?.(focused)
    }
    const onWindowBlur = () => {
      window.setTimeout(report, 0)
    }
    const onFocusIn = () => report()
    const onPointerDown = (event: PointerEvent) => {
      if (
        iframeRef.current &&
        event.target instanceof Node &&
        !iframeRef.current.contains(event.target) &&
        event.target !== iframeRef.current
      ) {
        if (document.activeElement === iframeRef.current) {
          iframeRef.current.blur()
        }
        onFocusChangeRef.current?.(false)
      }
    }

    window.addEventListener("blur", onWindowBlur)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      window.removeEventListener("blur", onWindowBlur)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("pointerdown", onPointerDown, true)
      onFocusChangeRef.current?.(false)
    }
  }, [href])

  if (!href) {
    return (
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        bg="gray.50"
        minH={{ base: "280px", md: "420px" }}
        px={6}
        py={10}
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        data-testid="pdf-reader-empty"
      >
        <Text color="brand.primary" fontWeight="medium">
          لا يتوفر ملف PDF لهذا الدرس
        </Text>
        <Text fontSize="sm" color="brand.secondary" maxW="md">
          يمكنك متابعة الشرح الصوتي والملاحظات. سيظهر الملف هنا عند إضافة رابط
          للكتاب أو للدرس.
        </Text>
      </Box>
    )
  }

  const retry = () => {
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
          onFocusChangeRef.current?.(false)
        }
      }}
    >
      <Flex justify="flex-end" mb={{ base: 2, md: 3 }} gap={2} flexWrap="wrap">
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
          fontSize={{ base: "xs", md: "sm" }}
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
        minH={{ base: "min(70vh, 520px)", md: "560px" }}
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
          ref={iframeRef}
          key={reloadKey}
          src={href}
          title={`قراءة ${title}`}
          style={{
            width: "100%",
            height: "min(70vh, 520px)",
            border: 0,
            display: "block",
          }}
          data-testid="pdf-reader-frame"
          onLoad={() => setStatus("ready")}
          onFocus={() => onFocusChangeRef.current?.(true)}
        />
      </Box>
    </Box>
  )
}
