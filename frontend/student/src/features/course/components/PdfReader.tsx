import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import { ExternalLink, RefreshCw, ZoomIn, ZoomOut } from "lucide-react"
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react"
import { loadPdfPage, savePdfPage } from "../lib/lessonProgress"

// pdf.js and its worker load only when a lesson with a PDF opens.
const PdfPages = lazy(() => import("./PdfPages"))

type PdfReaderProps = {
  url?: string | null
  title: string
  /** Remembers the page the student was reading in this lesson. */
  lessonId: string
}

type ReaderStatus = "loading" | "ready" | "error"

const LOAD_TIMEOUT_MS = 15_000
const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2, 2.5]

function pdfLoadTimeoutMs(): number {
  if (typeof window === "undefined") return LOAD_TIMEOUT_MS
  const override = (window as Window & { __COURSE_PDF_TIMEOUT_MS__?: number })
    .__COURSE_PDF_TIMEOUT_MS__
  return typeof override === "number" && override > 0
    ? override
    : LOAD_TIMEOUT_MS
}

/** The pdf.js chunk itself failed to download (offline, stale deploy). */
class ChunkErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function PdfReader({ url, title, lessonId }: PdfReaderProps) {
  const href = url?.trim()
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState<ReaderStatus>("loading")
  const [zoomIndex, setZoomIndex] = useState(ZOOM_STEPS.indexOf(1))
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [initialPage] = useState(() => loadPdfPage(lessonId) ?? 1)

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey restarts the timer on retry
  useEffect(() => {
    if (!href) return
    setStatus("loading")
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s))
    }, pdfLoadTimeoutMs())
    return () => window.clearTimeout(timer)
  }, [href, reloadKey])

  const handleLoaded = useCallback((pages: number) => {
    setNumPages(pages)
    setStatus("ready")
  }, [])
  const handleError = useCallback(() => setStatus("error"), [])
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      savePdfPage(lessonId, page)
    },
    [lessonId],
  )

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
          لا يتوفر ملف PDF لهذا المقرر
        </Text>
        <Text fontSize="sm" color="brand.secondary" maxW="md">
          يمكنك متابعة الشرح الصوتي. سيظهر الملف هنا عند إضافة رابط للكتاب أو
          للمقرر.
        </Text>
      </Box>
    )
  }

  const retry = () => {
    setReloadKey((k) => k + 1)
  }

  const zoom = ZOOM_STEPS[zoomIndex]
  const ready = status === "ready"

  return (
    <Box data-testid="pdf-reader">
      <Flex
        justify="space-between"
        align="center"
        mb={{ base: 2, md: 3 }}
        gap={2}
        flexWrap="wrap"
      >
        <Flex align="center" gap={2}>
          <Button
            variant="outline"
            size="sm"
            color="brand.primary"
            disabled={!ready || zoomIndex >= ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => i + 1)}
            data-testid="pdf-reader-zoom-in"
          >
            <ZoomIn size={16} />
            تكبير
          </Button>
          <Button
            variant="outline"
            size="sm"
            color="brand.primary"
            disabled={!ready || zoomIndex <= 0}
            onClick={() => setZoomIndex((i) => i - 1)}
            data-testid="pdf-reader-zoom-out"
          >
            <ZoomOut size={16} />
            تصغير
          </Button>
          {ready && currentPage ? (
            <Text
              fontSize="sm"
              color="brand.secondary"
              fontVariantNumeric="tabular-nums"
              data-testid="pdf-reader-page-indicator"
            >
              صفحة {currentPage} من {numPages}
            </Text>
          ) : null}
        </Flex>
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

      {status === "error" ? (
        <Box
          borderWidth="1px"
          borderColor="orange.200"
          borderRadius="md"
          bg="orange.50"
          px={4}
          py={6}
          textAlign="center"
          mb={3}
          data-testid="pdf-reader-error"
        >
          <Text color="brand.primary" fontWeight="medium" mb={2}>
            تعذر عرض الملف داخل الصفحة
          </Text>
          <Text fontSize="sm" color="brand.secondary" mb={4}>
            قد يكون الاتصال بطيئاً، أو أن الملف غير متاح حالياً. أعد المحاولة أو
            افتح الملف في تبويب جديد.
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
        bg="gray.100"
        // Fill leftover viewport under the header; leave room for the fixed player.
        h={{
          base: "min(62dvh, 480px)",
          md: "calc(100dvh - 14rem)",
          xl: "calc(100dvh - 13rem)",
        }}
        minH={{ base: "280px", md: "420px" }}
        position="relative"
        display={status === "error" ? "none" : "block"}
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
        <ChunkErrorBoundary key={reloadKey} onError={handleError}>
          <Suspense fallback={null}>
            <PdfPages
              url={href}
              title={title}
              zoom={zoom}
              initialPage={currentPage || initialPage}
              onLoaded={handleLoaded}
              onError={handleError}
              onPageChange={handlePageChange}
            />
          </Suspense>
        </ChunkErrorBoundary>
      </Box>
    </Box>
  )
}
