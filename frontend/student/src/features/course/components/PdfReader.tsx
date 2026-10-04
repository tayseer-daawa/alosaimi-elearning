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
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { loadPdfPage, savePdfPage } from "../lib/lessonProgress"
import {
  clampScale,
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

/**
 * Phone: height that makes the book fill the screen down to the lesson's
 * fixed audio player, so the page itself never scrolls (only the book does).
 * Measured, not hard-coded: a larger system font makes the header taller.
 */
function useFillToPlayer(
  boxRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): number | null {
  const [height, setHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (!enabled) return
    const measure = () => {
      const box = boxRef.current
      if (!box) return
      const rect = box.getBoundingClientRect()
      const top = rect.top + window.scrollY
      // What the page lays out below the book (its section's own bottom
      // spacing + the page's bottom padding), so the page ends at the screen
      // bottom. Not the document height: the page has min-height: 100vh, and
      // counting that filler would freeze the book at its first height.
      const page = box.closest<HTMLElement>("[data-lesson-page]")
      let section: HTMLElement = box
      while (section.parentElement && section.parentElement !== page) {
        section = section.parentElement
      }
      const sectionStyle = getComputedStyle(section)
      const below = page
        ? section.getBoundingClientRect().bottom -
          rect.bottom +
          (Number.parseFloat(sectionStyle.marginBottom) || 0) +
          (Number.parseFloat(getComputedStyle(page).paddingBottom) || 0)
        : 0
      const player = document.querySelector<HTMLElement>("[data-lesson-player]")
      const reserved = Math.max(below, (player?.offsetHeight ?? 0) + 8)
      setHeight(Math.max(240, Math.floor(window.innerHeight - top - reserved)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    // The page's bottom padding follows the player's height; with
    // min-height: 100vh only the page's content box notices that change.
    const page = boxRef.current?.closest<HTMLElement>("[data-lesson-page]")
    if (page) observer.observe(page)
    const player = document.querySelector<HTMLElement>("[data-lesson-player]")
    if (player) observer.observe(player)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [boxRef, enabled])
  return enabled ? height : null
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
 * Phone: the book fills the screen down to the audio player under one row of
 * compact labelled controls; «ملء الشاشة» opens a full-screen reading mode
 * with the lesson audio inside it.
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
  const pagesBoxRef = useRef<HTMLDivElement>(null)
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
  const phoneInline = isPhone && !reading
  const fillHeight = useFillToPlayer(pagesBoxRef, phoneInline)

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
  const openReading = () => setReading(true)
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
  } else if (phoneInline) {
    // Phone: one compact row; the book fills the rest down to the player.
    toolbar = (
      <Flex
        align="center"
        justify="space-between"
        gap={1}
        flexWrap="wrap"
        mb={1}
        data-testid="pdf-reader-phone-bar"
      >
        <Flex align="center" gap={0.5} data-testid="pdf-reader-page-nav">
          <CaptionButton
            icon={<ChevronUp size={20} />}
            label="السابقة"
            disabled={!ready || currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            testId="pdf-reader-prev-page"
          />
          <Text
            fontSize="sm"
            color="brand.secondary"
            whiteSpace="nowrap"
            fontVariantNumeric="tabular-nums"
            data-testid="pdf-reader-page-label"
          >
            {currentPage || "…"} من {numPages || "…"}
          </Text>
          <CaptionButton
            icon={<ChevronDown size={20} />}
            label="التالية"
            disabled={!ready || currentPage >= numPages}
            onClick={() => goToPage(currentPage + 1)}
            testId="pdf-reader-next-page"
          />
        </Flex>
        <Flex align="center" gap={0.5}>
          {/* One toggle, like a double-tap: fit width ↔ zoomed in. */}
          <CaptionButton
            icon={
              zoom.mode === "fit-width" ? (
                <ZoomIn size={20} />
              ) : (
                <ZoomOut size={20} />
              )
            }
            label={zoom.mode === "fit-width" ? "تكبير" : "تصغير"}
            disabled={!ready}
            onClick={() =>
              changeZoom(
                zoom.mode === "fit-width"
                  ? {
                      mode: "scale",
                      scale: clampScale(scale * 2),
                    }
                  : { mode: "fit-width" },
              )
            }
            testId="pdf-reader-zoom-toggle"
          />
          <CaptionButton
            icon={<Maximize size={20} />}
            label="ملء الشاشة"
            onClick={openReading}
            testId="pdf-reader-open-reading"
          />
        </Flex>
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
      ref={pagesBoxRef}
      borderWidth={readingMode ? 0 : "1px"}
      borderColor="gray.200"
      borderRadius={readingMode ? 0 : "md"}
      overflow="hidden"
      bg="gray.100"
      // Desktop: the book sits between the lesson header + toolbar and the
      // fixed audio player, so «الصفحة كاملة» shows the whole page above it.
      h={
        readingMode || fullscreen
          ? "auto"
          : phoneInline
            ? fillHeight
              ? `${fillHeight}px`
              : "calc(100dvh - 22rem)"
            : "calc(100dvh - 28rem)"
      }
      flex={readingMode || fullscreen ? "1" : undefined}
      minH={readingMode || fullscreen ? 0 : phoneInline ? "240px" : "320px"}
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
    ) : null

  const fillsScreen = readingMode || fullscreen

  // toolbar, error, pages and controls keep their positions in every layout,
  // so the loaded document survives opening and closing reading mode.
  return (
    <Box
      ref={readerRef}
      data-testid="pdf-reader"
      data-fullscreen={fullscreen ? "true" : "false"}
      data-reading={readingMode ? "true" : "false"}
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
      minW="11"
      px={1}
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
