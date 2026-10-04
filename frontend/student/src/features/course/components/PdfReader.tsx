import { Box, Button, Flex, Input, Link, Text } from "@chakra-ui/react"
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Maximize,
  Minimize,
  MoveHorizontal,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { loadPdfPage, savePdfPage } from "../lib/lessonProgress"
import { defaultPdfZoom, type PdfZoom, steppedScale } from "../lib/pdfZoom"
import type { PdfPagesHandle } from "./PdfPages"

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
  const readerRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<PdfPagesHandle>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState<ReaderStatus>("loading")
  const [zoom, setZoom] = useState<PdfZoom>(defaultPdfZoom)
  const [scale, setScale] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageDraft, setPageDraft] = useState<string | null>(null)
  const [initialPage] = useState(() => loadPdfPage(lessonId) ?? 1)
  const [fullscreen, setFullscreen] = useState(false)
  const canFullscreen =
    typeof document !== "undefined" && document.fullscreenEnabled

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey restarts the timer on retry
  useEffect(() => {
    if (!href) return
    setStatus("loading")
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s))
    }, pdfLoadTimeoutMs())
    return () => window.clearTimeout(timer)
  }, [href, reloadKey])

  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === readerRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

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

  const ready = status === "ready"
  const goToPage = (page: number) => {
    if (!numPages) return
    pagesRef.current?.scrollToPage(Math.min(Math.max(page, 1), numPages))
  }
  const commitPageDraft = () => {
    const page = Number.parseInt(pageDraft ?? "", 10)
    setPageDraft(null)
    if (Number.isFinite(page)) goToPage(page)
  }
  const zoomStep = (direction: 1 | -1) => {
    const next = steppedScale(scale, direction)
    if (next != null) setZoom({ mode: "scale", scale: next })
  }
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void readerRef.current?.requestFullscreen().catch(() => {
        // refused (e.g. iframe without allowfullscreen) — stay inline
      })
    }
  }

  return (
    <Box
      ref={readerRef}
      data-testid="pdf-reader"
      data-fullscreen={fullscreen ? "true" : "false"}
      {...(fullscreen
        ? {
            bg: "white",
            p: 3,
            h: "100dvh",
            display: "flex",
            flexDirection: "column",
          }
        : {})}
    >
      {/* One wrapping row: a single line on desktop, three on a phone. */}
      <Flex
        align="center"
        gap={2}
        columnGap={4}
        flexWrap="wrap"
        mb={{ base: 2, md: 3 }}
      >
        <Flex align="center" gap={1.5} data-testid="pdf-reader-page-nav">
          <ToolButton
            disabled={!ready || currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            testId="pdf-reader-prev-page"
          >
            <ChevronUp size={16} />
            السابقة
          </ToolButton>
          <Text fontSize="sm" color="brand.secondary">
            صفحة
          </Text>
          <Input
            size="sm"
            w="14"
            textAlign="center"
            inputMode="numeric"
            aria-label="رقم الصفحة"
            disabled={!ready}
            value={pageDraft ?? (currentPage ? String(currentPage) : "")}
            onFocus={(e) => {
              setPageDraft(e.currentTarget.value)
              e.currentTarget.select()
            }}
            onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={commitPageDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") {
                setPageDraft(null)
                e.currentTarget.blur()
              }
            }}
            data-testid="pdf-reader-page-input"
          />
          <Text
            fontSize="sm"
            color="brand.secondary"
            fontVariantNumeric="tabular-nums"
            data-testid="pdf-reader-page-count"
          >
            من {numPages || "…"}
          </Text>
          <ToolButton
            disabled={!ready || currentPage >= numPages}
            onClick={() => goToPage(currentPage + 1)}
            testId="pdf-reader-next-page"
          >
            التالية
            <ChevronDown size={16} />
          </ToolButton>
        </Flex>

        <Flex align="center" gap={1.5} flexWrap="wrap">
          <ToolButton
            disabled={!ready || steppedScale(scale, -1) == null}
            onClick={() => zoomStep(-1)}
            testId="pdf-reader-zoom-out"
          >
            <ZoomOut size={16} />
            تصغير
          </ToolButton>
          <Text
            fontSize="sm"
            color="brand.secondary"
            minW="10"
            textAlign="center"
            fontVariantNumeric="tabular-nums"
            data-testid="pdf-reader-zoom-level"
          >
            {Math.round(scale * 100)}٪
          </Text>
          <ToolButton
            disabled={!ready || steppedScale(scale, 1) == null}
            onClick={() => zoomStep(1)}
            testId="pdf-reader-zoom-in"
          >
            <ZoomIn size={16} />
            تكبير
          </ToolButton>
          {/* A whole page at phone width is too small to read. */}
          <ToolButton
            active={zoom.mode === "fit-page"}
            disabled={!ready}
            onClick={() => setZoom({ mode: "fit-page" })}
            testId="pdf-reader-fit-page"
            hideOnPhone
          >
            <FileText size={16} />
            الصفحة كاملة
          </ToolButton>
          <ToolButton
            active={zoom.mode === "fit-width"}
            disabled={!ready}
            onClick={() => setZoom({ mode: "fit-width" })}
            testId="pdf-reader-fit-width"
          >
            <MoveHorizontal size={16} />
            ملء العرض
          </ToolButton>
          {canFullscreen ? (
            <ToolButton
              active={fullscreen}
              onClick={toggleFullscreen}
              testId="pdf-reader-fullscreen"
            >
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              {fullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
            </ToolButton>
          ) : null}
        </Flex>
        <Link
          ms="auto"
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
        // Fit between the lesson header + toolbar and the fixed audio player
        // (~28rem together on phones and desktops) so «الصفحة كاملة» really
        // shows the whole page above the player.
        h={fullscreen ? "auto" : "calc(100dvh - 28rem)"}
        flex={fullscreen ? "1" : undefined}
        minH={fullscreen ? 0 : "320px"}
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
              ref={pagesRef}
              url={href}
              title={title}
              zoom={zoom}
              initialPage={currentPage || initialPage}
              onLoaded={handleLoaded}
              onError={handleError}
              onPageChange={handlePageChange}
              onScaleChange={setScale}
              onZoomRequest={setZoom}
            />
          </Suspense>
        </ChunkErrorBoundary>
      </Box>
    </Box>
  )
}

/** Labelled outline button — the reader's controls stay visible and named. */
function ToolButton({
  children,
  onClick,
  disabled,
  active,
  testId,
  hideOnPhone,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  testId: string
  hideOnPhone?: boolean
}) {
  return (
    <Button
      display={hideOnPhone ? { base: "none", md: "inline-flex" } : undefined}
      variant={active ? "subtle" : "outline"}
      size="sm"
      color="brand.primary"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
    >
      {children}
    </Button>
  )
}
