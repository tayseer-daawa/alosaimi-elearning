import { Box, Flex, Text } from "@chakra-ui/react"
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/TextLayer.css"
import { clampScale, type PdfZoom } from "../lib/pdfZoom"

// Must be set in the module that renders <Document> (react-pdf README).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const PAGE_GAP_PX = 12
const SIDE_PADDING_PX = 12
/** A4 portrait in points — placeholder until the first page reports its size. */
const DEFAULT_PAGE_PT = { width: 595, height: 842 }
/** PDF points → CSS pixels, so scale 1 matches the browser viewer's 100%. */
const PT_TO_CSS_PX = 96 / 72
/** Phones report 3×; 2× stays sharp without huge canvases. */
const MAX_PIXEL_RATIO = 2
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_SLOP_PX = 30
/** Double-tap zooms from fit-width to this multiple of it. */
const DOUBLE_TAP_ZOOM = 2

export type PdfPagesHandle = {
  scrollToPage: (page: number) => void
}

/** A point in the book (page + position inside it) pinned to a screen point. */
type ZoomAnchor = {
  page: number
  fx: number
  fy: number
  clientX: number
  clientY: number
}

export type PdfPagesProps = {
  url: string
  title: string
  zoom: PdfZoom
  /** Page to scroll to once the pages are laid out. */
  initialPage: number
  onLoaded: (numPages: number) => void
  onError: () => void
  onPageChange: (page: number) => void
  /** Effective scale after fitting (1 = natural size), for the % label. */
  onScaleChange: (scale: number) => void
  /** Ctrl + wheel, pinch and double-tap over the pages. */
  onZoomRequest: (zoom: PdfZoom) => void
  ref?: Ref<PdfPagesHandle>
}

function pageAtOffset(offsets: number[], y: number): number {
  let page = 1
  for (let i = 0; i < offsets.length && offsets[i] <= y; i++) page = i + 1
  return page
}

/**
 * Renders the PDF with pdf.js inside its own scroll box. Only pages near the
 * visible area are drawn; the rest are placeholders of the same height so the
 * scrollbar and page offsets stay stable on long books.
 */
export default function PdfPages({
  url,
  title,
  zoom,
  initialPage,
  onLoaded,
  onError,
  onPageChange,
  onScaleChange,
  onZoomRequest,
  ref,
}: PdfPagesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [firstPage, setFirstPage] = useState(DEFAULT_PAGE_PT)
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const [viewWidth, setViewWidth] = useState(0)
  const [viewHeight, setViewHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const restoredRef = useRef(false)
  const pageWidthRef = useRef(0)
  const currentPageRef = useRef(0)
  const anchorRef = useRef<ZoomAnchor | null>(null)
  /** Page offsets/heights as last laid out, to keep the reading position. */
  const layoutRef = useRef<{ offsets: number[]; heights: number[] }>({
    offsets: [],
    heights: [],
  })

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => {
      setViewWidth(el.clientWidth)
      setViewHeight(el.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const defaultRatio = firstPage.height / firstPage.width
  const naturalWidth = firstPage.width * PT_TO_CSS_PX
  const fitWidth = Math.max(0, viewWidth - SIDE_PADDING_PX * 2)
  const fitPage = Math.min(
    fitWidth,
    Math.max(0, viewHeight - PAGE_GAP_PX * 2) / defaultRatio,
  )
  const pageWidth = Math.floor(
    zoom.mode === "fit-width"
      ? fitWidth
      : zoom.mode === "fit-page"
        ? fitPage
        : naturalWidth * zoom.scale,
  )
  const effectiveScale = naturalWidth ? pageWidth / naturalWidth : 1
  const fitWidthScale = naturalWidth ? fitWidth / naturalWidth : 1

  const heights: number[] = []
  const offsets: number[] = []
  let top = PAGE_GAP_PX
  for (let n = 1; n <= numPages; n++) {
    const height = Math.round(pageWidth * (ratios[n] ?? defaultRatio))
    offsets.push(top)
    heights.push(height)
    top += height + PAGE_GAP_PX
  }

  // Latest values for the native event listeners below.
  const latest = useRef({
    offsets,
    heights,
    effectiveScale,
    fitWidthScale,
    onZoomRequest,
  })
  useLayoutEffect(() => {
    latest.current = {
      offsets,
      heights,
      effectiveScale,
      fitWidthScale,
      onZoomRequest,
    }
  })

  useImperativeHandle(ref, () => ({
    scrollToPage: (page: number) => {
      const el = scrollerRef.current
      const pageTop = latest.current.offsets[page - 1]
      if (el && pageTop != null) el.scrollTop = pageTop - PAGE_GAP_PX
    },
  }))

  useEffect(() => {
    if (pageWidth > 0) onScaleChange(Math.round(effectiveScale * 100) / 100)
  }, [pageWidth, effectiveScale, onScaleChange])

  // Ctrl + wheel (and trackpad pinch, which browsers send as ctrl+wheel),
  // two-finger pinch and double-tap zoom the book, not the whole page.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const anchorAt = (clientX: number, clientY: number): ZoomAnchor | null => {
      const rect = el.getBoundingClientRect()
      const page = pageAtOffset(
        latest.current.offsets,
        clientY - rect.top + el.scrollTop,
      )
      const pageEl = el.querySelector<HTMLElement>(`[data-page="${page}"]`)
      if (!pageEl) return null
      const box = pageEl.getBoundingClientRect()
      return {
        page,
        fx: (clientX - box.left) / box.width,
        fy: (clientY - box.top) / box.height,
        clientX,
        clientY,
      }
    }
    const requestZoom = (next: PdfZoom, anchor: ZoomAnchor | null) => {
      anchorRef.current = anchor
      latest.current.onZoomRequest(next)
    }

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const scale = clampScale(
        latest.current.effectiveScale * Math.exp(-event.deltaY / 300),
      )
      requestZoom(
        { mode: "scale", scale },
        anchorAt(event.clientX, event.clientY),
      )
    }

    let pinch: {
      startDistance: number
      startScale: number
      factor: number
      anchor: ZoomAnchor | null
    } | null = null
    let moved = false
    let lastTap = { time: 0, x: 0, y: 0 }
    const distance = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const t = event.touches
        const x = (t[0].clientX + t[1].clientX) / 2
        const y = (t[0].clientY + t[1].clientY) / 2
        pinch = {
          startDistance: distance(t),
          startScale: latest.current.effectiveScale,
          factor: 1,
          anchor: anchorAt(x, y),
        }
        // Scale the drawn pages around the fingers while pinching; the real
        // re-render happens once, on release.
        const doc = documentRef.current
        if (doc) {
          const box = doc.getBoundingClientRect()
          doc.style.transformOrigin = `${x - box.left}px ${y - box.top}px`
        }
      } else if (event.touches.length === 1) {
        moved = false
      }
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) moved = true
      if (!pinch || event.touches.length !== 2) return
      event.preventDefault()
      const target = clampScale(
        (pinch.startScale * distance(event.touches)) / pinch.startDistance,
      )
      pinch.factor = target / pinch.startScale
      const doc = documentRef.current
      if (doc) doc.style.transform = `scale(${pinch.factor})`
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (pinch) {
        if (event.touches.length >= 2) return
        const { startScale, factor, anchor } = pinch
        pinch = null
        lastTap.time = 0
        const doc = documentRef.current
        if (doc) {
          doc.style.transform = ""
          doc.style.transformOrigin = ""
        }
        if (Math.abs(factor - 1) > 0.02) {
          requestZoom(
            { mode: "scale", scale: clampScale(startScale * factor) },
            anchor,
          )
        }
        return
      }
      if (event.touches.length !== 0 || event.changedTouches.length !== 1)
        return
      if (moved) return
      const t = event.changedTouches[0]
      const now = performance.now()
      const isDoubleTap =
        now - lastTap.time < DOUBLE_TAP_MS &&
        Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) <
          DOUBLE_TAP_SLOP_PX
      if (!isDoubleTap) {
        lastTap = { time: now, x: t.clientX, y: t.clientY }
        return
      }
      lastTap.time = 0
      event.preventDefault()
      const fit = latest.current.fitWidthScale
      const zoomedIn = latest.current.effectiveScale > fit * 1.05
      requestZoom(
        zoomedIn
          ? { mode: "fit-width" }
          : { mode: "scale", scale: clampScale(fit * DOUBLE_TAP_ZOOM) },
        anchorAt(t.clientX, t.clientY),
      )
    }
    // iOS Safari pinches the whole page through its own gesture events.
    const onGesture = (event: Event) => event.preventDefault()

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: false })
    el.addEventListener("touchcancel", onTouchEnd, { passive: false })
    el.addEventListener("gesturestart", onGesture, { passive: false })
    el.addEventListener("gesturechange", onGesture, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
      el.removeEventListener("gesturestart", onGesture)
      el.removeEventListener("gesturechange", onGesture)
    }
  }, [])

  // Keep the same spot in the book when zoom or the reader width changes:
  // under the fingers / cursor for gestures; otherwise the same page and
  // position inside it (gaps between pages do not scale, so a plain
  // proportional scroll would drift on later pages).
  useLayoutEffect(() => {
    const el = scrollerRef.current
    const previous = pageWidthRef.current
    pageWidthRef.current = pageWidth
    if (!el || !previous || !pageWidth || previous === pageWidth) return
    const anchor = anchorRef.current
    anchorRef.current = null
    const pageEl =
      anchor && el.querySelector<HTMLElement>(`[data-page="${anchor.page}"]`)
    if (anchor && pageEl) {
      const box = pageEl.getBoundingClientRect()
      el.scrollTop += box.top + anchor.fy * box.height - anchor.clientY
      el.scrollLeft += box.left + anchor.fx * box.width - anchor.clientX
      return
    }
    const before = layoutRef.current
    const { offsets: nowOffsets, heights: nowHeights } = latest.current
    const index = pageAtOffset(before.offsets, el.scrollTop) - 1
    if (nowOffsets[index] != null && before.heights[index]) {
      const within = Math.min(
        Math.max(
          (el.scrollTop - before.offsets[index]) / before.heights[index],
          0,
        ),
        1,
      )
      el.scrollTop = nowOffsets[index] + within * nowHeights[index]
    }
    el.scrollLeft = el.scrollLeft * (pageWidth / previous)
  }, [pageWidth])

  // Open on the requested page once the pages are laid out.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (restoredRef.current || !el || !numPages || !pageWidth) return
    restoredRef.current = true
    const target = Math.min(Math.max(initialPage, 1), numPages)
    el.scrollTop = target > 1 ? offsets[target - 1] - PAGE_GAP_PX : 0
  })

  // After the effects above, so they see the previous layout.
  useLayoutEffect(() => {
    layoutRef.current = { offsets, heights }
  })

  const currentPage = numPages
    ? pageAtOffset(offsets, scrollTop + viewHeight * 0.3)
    : 0
  useEffect(() => {
    if (!currentPage || currentPage === currentPageRef.current) return
    currentPageRef.current = currentPage
    onPageChange(currentPage)
  }, [currentPage, onPageChange])

  // Draw one screen above and below the visible area.
  const drawFrom = scrollTop - viewHeight
  const drawTo = scrollTop + viewHeight * 2
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1)

  return (
    <Box
      ref={scrollerRef}
      h="full"
      overflow="auto"
      overscrollBehavior="contain"
      // The browser still scrolls; pinch and double-tap are handled above.
      touchAction="pan-x pan-y"
      bg="gray.100"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      role="region"
      aria-label={`قراءة ${title}`}
      data-testid="pdf-reader-pages"
    >
      <Document
        file={url}
        inputRef={documentRef}
        suspense={false}
        loading={null}
        error={null}
        onLoadSuccess={(pdf) => {
          setNumPages(pdf.numPages)
          void pdf
            .getPage(1)
            .then((first) => {
              const { width, height } = first.getViewport({ scale: 1 })
              if (width > 0 && height > 0) setFirstPage({ width, height })
            })
            .catch(() => {
              // keep the A4 guess
            })
          onLoaded(pdf.numPages)
        }}
        onLoadError={onError}
        onSourceError={onError}
      >
        {pageWidth > 0
          ? heights.map((height, index) => {
              const n = index + 1
              const pageTop = offsets[index]
              const draw = pageTop + height >= drawFrom && pageTop <= drawTo
              return (
                <Box
                  key={n}
                  w={`${pageWidth}px`}
                  h={`${height}px`}
                  mx="auto"
                  mt={`${PAGE_GAP_PX}px`}
                  bg="white"
                  boxShadow="sm"
                  position="relative"
                  overflow="hidden"
                  data-page={n}
                  data-testid={`pdf-reader-page-${n}`}
                  data-drawn={draw ? "true" : "false"}
                >
                  {draw ? (
                    <Page
                      pageNumber={n}
                      width={pageWidth}
                      devicePixelRatio={pixelRatio}
                      renderAnnotationLayer={false}
                      loading={null}
                      error={<PageMessage text="تعذر عرض هذه الصفحة" />}
                      onLoadSuccess={(page) => {
                        const ratio = page.originalHeight / page.originalWidth
                        if (
                          Math.abs(ratio - (ratios[n] ?? defaultRatio)) > 0.01
                        ) {
                          setRatios((prev) => ({ ...prev, [n]: ratio }))
                        }
                      }}
                    />
                  ) : null}
                </Box>
              )
            })
          : null}
        {numPages ? <Box h={`${PAGE_GAP_PX}px`} /> : null}
      </Document>
    </Box>
  )
}

function PageMessage({ text }: { text: string }) {
  return (
    <Flex position="absolute" inset={0} align="center" justify="center">
      <Text color="brand.secondary" fontSize="sm">
        {text}
      </Text>
    </Flex>
  )
}
