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

export type PdfPagesHandle = {
  scrollToPage: (page: number) => void
}

export type PdfPagesProps = {
  url: string
  title: string
  zoom: PdfZoom
  /** Page to scroll to once the document is laid out. */
  initialPage: number
  onLoaded: (numPages: number) => void
  onError: () => void
  onPageChange: (page: number) => void
  /** Effective scale after fitting (1 = natural size), for the % label. */
  onScaleChange: (scale: number) => void
  /** Ctrl + wheel / trackpad pinch over the pages. */
  onZoomRequest: (zoom: PdfZoom) => void
  ref?: Ref<PdfPagesHandle>
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
  const [numPages, setNumPages] = useState(0)
  const [firstPage, setFirstPage] = useState(DEFAULT_PAGE_PT)
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const [viewWidth, setViewWidth] = useState(0)
  const [viewHeight, setViewHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const restoredRef = useRef(false)
  const pageWidthRef = useRef(0)
  const currentPageRef = useRef(0)

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

  const heights: number[] = []
  const offsets: number[] = []
  let top = PAGE_GAP_PX
  for (let n = 1; n <= numPages; n++) {
    const height = Math.round(pageWidth * (ratios[n] ?? defaultRatio))
    offsets.push(top)
    heights.push(height)
    top += height + PAGE_GAP_PX
  }
  const offsetsRef = useRef(offsets)
  const scaleRef = useRef(effectiveScale)
  useLayoutEffect(() => {
    offsetsRef.current = offsets
    scaleRef.current = effectiveScale
  })

  useImperativeHandle(ref, () => ({
    scrollToPage: (page: number) => {
      const el = scrollerRef.current
      const pageTop = offsetsRef.current[page - 1]
      if (el && pageTop != null) el.scrollTop = pageTop - PAGE_GAP_PX
    },
  }))

  useEffect(() => {
    if (pageWidth > 0) onScaleChange(Math.round(effectiveScale * 100) / 100)
  }, [pageWidth, effectiveScale, onScaleChange])

  // Ctrl + wheel (and trackpad pinch, which browsers send as ctrl+wheel)
  // zooms the book instead of the whole page. Needs a non-passive listener.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const scale = clampScale(scaleRef.current * Math.exp(-event.deltaY / 300))
      onZoomRequest({ mode: "scale", scale })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [onZoomRequest])

  const pageAt = (y: number) => {
    let page = 1
    for (let i = 0; i < offsets.length && offsets[i] <= y; i++) page = i + 1
    return page
  }

  // Keep the same spot in the book when zoom or the reader width changes.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    const previous = pageWidthRef.current
    pageWidthRef.current = pageWidth
    if (!el || !previous || !pageWidth || previous === pageWidth) return
    el.scrollTop = el.scrollTop * (pageWidth / previous)
    el.scrollLeft = el.scrollLeft * (pageWidth / previous)
  }, [pageWidth])

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (restoredRef.current || !el || !numPages || !pageWidth) return
    restoredRef.current = true
    const target = Math.min(Math.max(initialPage, 1), numPages)
    if (target > 1) el.scrollTop = offsets[target - 1] - PAGE_GAP_PX
  })

  const currentPage = numPages ? pageAt(scrollTop + viewHeight * 0.3) : 0
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
      bg="gray.100"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      role="region"
      aria-label={`قراءة ${title}`}
      data-testid="pdf-reader-pages"
    >
      <Document
        file={url}
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
