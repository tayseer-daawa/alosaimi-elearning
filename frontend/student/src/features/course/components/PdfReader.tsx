import { Box, Button, Flex, Input, Link, Text } from "@chakra-ui/react"
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Maximize,
  Minimize,
  MoveHorizontal,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import {
  Component,
  lazy,
  type ReactNode,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { loadPdfPage, savePdfPage } from "../lib/lessonProgress"
import {
  defaultPdfZoom,
  loadPdfZoom,
  type PdfZoom,
  type ReaderLayout,
  savePdfZoom,
  steppedScale,
} from "../lib/pdfZoom"
import type { AudioPlaybackApi } from "./AudioPlayer"
import type { PdfPagesHandle } from "./PdfPages"
import { ReadingAudioBar } from "./ReadingAudioBar"

// pdf.js and its worker load only when a lesson with a PDF opens.
const PdfPages = lazy(() => import("./PdfPages"))

type PdfReaderProps = {
  url?: string | null
  title: string
  /** Remembers the page the student was reading in this lesson. */
  lessonId: string
  /** Lesson audio, for the play / ±10s strip in the phone reading mode. */
  audioApiRef?: RefObject<AudioPlaybackApi | null>
}

type ReaderStatus = "loading" | "ready" | "error"

const LOAD_TIMEOUT_MS = 15_000
/** Chakra `md` — below this the reader uses the phone layout. */
const PHONE_MQ = "(max-width: 47.99em)"

function pdfLoadTimeoutMs(): number {
  if (typeof window === "undefined") return LOAD_TIMEOUT_MS
  const override = (window as Window & { __COURSE_PDF_TIMEOUT_MS__?: number })
    .__COURSE_PDF_TIMEOUT_MS__
  return typeof override === "number" && override > 0
    ? override
    : LOAD_TIMEOUT_MS
}

function matchesPhone(): boolean {
  return typeof window !== "undefined" && window.matchMedia(PHONE_MQ).matches
}

function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(matchesPhone)
  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ)
    const onChange = () => setIsPhone(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return isPhone
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

/**
 * Desktop: the book with a one-row toolbar above it.
 * Phone: a book card (cover + «اقرأ الكتاب») that opens a full-screen
 * reading mode with compact labelled controls and the lesson audio.
 */
export function PdfReader({
  url,
  title,
  lessonId,
  audioApiRef,
}: PdfReaderProps) {
  const href = url?.trim()
  const readerRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<PdfPagesHandle>(null)
  const isPhone = useIsPhone()
  const layout: ReaderLayout = isPhone ? "phone" : "desktop"
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState<ReaderStatus>("loading")
  const [zoom, setZoom] = useState<PdfZoom>(() => {
    const initialLayout = matchesPhone() ? "phone" : "desktop"
    return loadPdfZoom(initialLayout) ?? defaultPdfZoom(initialLayout)
  })
  const [scale, setScale] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageDraft, setPageDraft] = useState<string | null>(null)
  const [initialPage] = useState(() => loadPdfPage(lessonId) ?? 1)
  const [fullscreen, setFullscreen] = useState(false)
  const [reading, setReading] = useState(false)
  const canFullscreen =
    typeof document !== "undefined" && document.fullscreenEnabled
  const readingMode = isPhone && reading
  const bookCard = isPhone && !reading

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

  // Reading mode: lock the page behind it, and let the phone's back button
  // (or Escape) close it instead of leaving the lesson.
  useEffect(() => {
    if (!readingMode) return
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = "hidden"
    window.history.pushState({ ...window.history.state, pdfReading: true }, "")
    const onPopState = () => setReading(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.history.back()
    }
    window.addEventListener("popstate", onPopState)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      root.style.overflow = previousOverflow
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [readingMode])

  const changeZoom = useCallback(
    (next: PdfZoom) => {
      setZoom(next)
      savePdfZoom(layout, next)
    },
    [layout],
  )
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
        minH={{ base: "200px", md: "420px" }}
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
  const shownPage = currentPage || initialPage
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
    if (next != null) changeZoom({ mode: "scale", scale: next })
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
  const openReading = () => {
    if (ready) setReading(true)
  }
  const closeReading = () => {
    // Pops the history entry pushed on open; popstate then closes the mode.
    if (window.history.state?.pdfReading) window.history.back()
    else setReading(false)
  }

  const zoomLevel = (
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
  )

  const pageInput = (
    <Input
      size="sm"
      w="14"
      flexShrink={0}
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
          e.stopPropagation()
          setPageDraft(null)
          e.currentTarget.blur()
        }
      }}
      data-testid="pdf-reader-page-input"
    />
  )

  const pageCount = (
    <Text
      fontSize="sm"
      color="brand.secondary"
      whiteSpace="nowrap"
      fontVariantNumeric="tabular-nums"
      data-testid="pdf-reader-page-count"
    >
      من {numPages || "…"}
    </Text>
  )

  const openTabLink = (
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
  )

  let toolbar: ReactNode = null
  if (!isPhone) {
    // Desktop / tablet: one wrapping row above the book.
    toolbar = (
      <Flex align="center" gap={2} columnGap={4} flexWrap="wrap" mb={3}>
        <Flex align="center" gap={1.5} data-testid="pdf-reader-page-nav">
          <ToolButton
            disabled={!ready || currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            testId="pdf-reader-prev-page"
          >
            <ChevronUp size={16} />
            السابقة
          </ToolButton>
          {pageInput}
          {pageCount}
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
          {zoomLevel}
          <ToolButton
            disabled={!ready || steppedScale(scale, 1) == null}
            onClick={() => zoomStep(1)}
            testId="pdf-reader-zoom-in"
          >
            <ZoomIn size={16} />
            تكبير
          </ToolButton>
          <ToolButton
            active={zoom.mode === "fit-page"}
            disabled={!ready}
            onClick={() => changeZoom({ mode: "fit-page" })}
            testId="pdf-reader-fit-page"
          >
            <FileText size={16} />
            الصفحة كاملة
          </ToolButton>
          <ToolButton
            active={zoom.mode === "fit-width"}
            disabled={!ready}
            onClick={() => changeZoom({ mode: "fit-width" })}
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
        <Box ms="auto">{openTabLink}</Box>
      </Flex>
    )
  } else if (bookCard) {
    // Phone: the card's text side; the cover thumbnail is the pages box.
    toolbar =
      status === "error" ? null : (
        <Flex direction="column" gap={2} flex="1" minW={0}>
          <Text
            fontWeight="semibold"
            color="brand.primary"
            lineClamp={2}
            data-testid="pdf-reader-card-title"
          >
            {title}
          </Text>
          <Text
            fontSize="sm"
            color="brand.secondary"
            fontVariantNumeric="tabular-nums"
            data-testid="pdf-reader-page-label"
          >
            صفحة {shownPage} من {numPages || "…"}
          </Text>
          <Button
            size="lg"
            bg="brand.primary"
            color="white"
            loading={!ready}
            onClick={openReading}
            data-testid="pdf-reader-open-reading"
          >
            <BookOpen size={20} />
            اقرأ الكتاب
          </Button>
        </Flex>
      )
  } else {
    // Reading mode, top: close + zoom.
    toolbar = (
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        px={2}
        py={1}
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <CaptionButton
          icon={<X size={20} />}
          label="إغلاق"
          onClick={closeReading}
          testId="pdf-reader-close-reading"
        />
        <Flex align="center" gap={1}>
          <CaptionButton
            icon={<ZoomOut size={20} />}
            label="تصغير"
            disabled={!ready || steppedScale(scale, -1) == null}
            onClick={() => zoomStep(-1)}
            testId="pdf-reader-zoom-out"
          />
          {zoomLevel}
          <CaptionButton
            icon={<ZoomIn size={20} />}
            label="تكبير"
            disabled={!ready || steppedScale(scale, 1) == null}
            onClick={() => zoomStep(1)}
            testId="pdf-reader-zoom-in"
          />
        </Flex>
      </Flex>
    )
  }

  const pagesBox = (
    <Box
      borderWidth={readingMode ? 0 : "1px"}
      borderColor="gray.200"
      borderRadius={readingMode ? 0 : bookCard ? "sm" : "md"}
      overflow="hidden"
      bg="gray.100"
      // Desktop: the book sits between the lesson header + toolbar and the
      // fixed audio player, so «الصفحة كاملة» shows the whole page above it.
      h={
        bookCard
          ? "auto"
          : readingMode || fullscreen
            ? "auto"
            : "calc(100dvh - 28rem)"
      }
      w={bookCard ? "88px" : undefined}
      minW={bookCard ? "88px" : undefined}
      flex={readingMode || fullscreen ? "1" : undefined}
      minH={bookCard ? "124px" : readingMode || fullscreen ? 0 : "320px"}
      // Cover first (on the right in RTL), text beside it.
      order={bookCard ? -1 : undefined}
      cursor={bookCard ? "pointer" : undefined}
      onClick={bookCard ? openReading : undefined}
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
          {bookCard ? null : (
            <Text color="brand.secondary" fontSize="sm">
              جاري تحميل الملف…
            </Text>
          )}
        </Flex>
      ) : null}
      <ChunkErrorBoundary key={reloadKey} onError={handleError}>
        <Suspense fallback={null}>
          <PdfPages
            ref={pagesRef}
            url={href}
            title={title}
            zoom={zoom}
            view={bookCard ? "cover" : "pages"}
            initialPage={shownPage}
            onLoaded={handleLoaded}
            onError={handleError}
            onPageChange={handlePageChange}
            onScaleChange={setScale}
            onZoomRequest={changeZoom}
          />
        </Suspense>
      </ChunkErrorBoundary>
    </Box>
  )

  const errorPanel =
    status === "error" ? (
      <Box
        borderWidth="1px"
        borderColor="orange.200"
        borderRadius="md"
        bg="orange.50"
        px={4}
        py={6}
        textAlign="center"
        m={readingMode ? 3 : 0}
        mb={bookCard ? 0 : 3}
        flex={bookCard ? "1" : undefined}
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
    ) : null

  const fillsScreen = readingMode || fullscreen

  // toolbar, error, pages and controls keep their positions in every layout,
  // so the loaded document survives switching between card and reading mode.
  return (
    <Box
      ref={readerRef}
      data-testid="pdf-reader"
      data-fullscreen={fullscreen ? "true" : "false"}
      data-reading={readingMode ? "true" : "false"}
      {...(bookCard
        ? {
            display: "flex",
            alignItems: "center",
            gap: 4,
            p: 3,
            borderWidth: "1px",
            borderColor: "gray.200",
            borderRadius: "lg",
            bg: "white",
            "data-card": "true",
          }
        : {})}
      {...(readingMode
        ? {
            position: "fixed",
            inset: 0,
            zIndex: "modal",
            role: "dialog",
            "aria-modal": true,
            "aria-label": `قراءة ${title}`,
          }
        : {})}
      {...(fillsScreen
        ? {
            bg: "white",
            p: readingMode ? 0 : 3,
            h: "100dvh",
            display: "flex",
            flexDirection: "column",
          }
        : {})}
    >
      {toolbar}
      {errorPanel}
      {pagesBox}
      {readingMode ? (
        <Flex
          direction="column"
          align="center"
          gap={1}
          px={2}
          pt={1}
          pb="calc(0.25rem + env(safe-area-inset-bottom, 0px))"
          borderTopWidth="1px"
          borderColor="gray.200"
          data-testid="pdf-reader-reading-controls"
        >
          <Flex
            align="center"
            justify="center"
            gap={2}
            data-testid="pdf-reader-page-nav"
          >
            <CaptionButton
              icon={<ChevronUp size={20} />}
              label="السابقة"
              disabled={!ready || currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              testId="pdf-reader-prev-page"
            />
            {pageInput}
            {pageCount}
            <CaptionButton
              icon={<ChevronDown size={20} />}
              label="التالية"
              disabled={!ready || currentPage >= numPages}
              onClick={() => goToPage(currentPage + 1)}
              testId="pdf-reader-next-page"
            />
          </Flex>
          {audioApiRef ? <ReadingAudioBar apiRef={audioApiRef} /> : null}
        </Flex>
      ) : null}
    </Box>
  )
}

/** Labelled outline button — the desktop toolbar's controls stay named. */
function ToolButton({
  children,
  onClick,
  disabled,
  active,
  testId,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  testId: string
}) {
  return (
    <Button
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

/** Phone control: icon with a short word under it, like a bottom tab bar. */
function CaptionButton({
  icon,
  label,
  onClick,
  disabled,
  testId,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  testId: string
}) {
  return (
    <Button
      variant="ghost"
      color="brand.primary"
      h="auto"
      minH="12"
      minW="14"
      px={2}
      py={1}
      flexDirection="column"
      gap={0.5}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
    >
      {icon}
      <Text as="span" fontSize="xs" lineHeight="1" fontWeight="medium">
        {label}
      </Text>
    </Button>
  )
}
