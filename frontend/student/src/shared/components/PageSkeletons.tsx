import {
  Box,
  Flex,
  Grid,
  Skeleton,
  SkeletonCircle,
  VStack,
} from "@chakra-ui/react"
import type { ReactNode } from "react"

/** Soft teal pulse matching brand.primary. */
const sk = {
  variant: "pulse" as const,
  css: {
    "--start-color": "colors.gray.100",
    "--end-color": "colors.brand.lightTeal",
  },
}

type ScreenSkeletonProps = {
  label?: string
  children: ReactNode
}

function ScreenSkeleton({
  label = "جاري التحميل",
  children,
}: ScreenSkeletonProps) {
  return (
    <Box
      dir="rtl"
      w="full"
      aria-busy="true"
      aria-live="polite"
      data-testid="screen-skeleton"
    >
      <Box
        as="span"
        position="absolute"
        w="1px"
        h="1px"
        p={0}
        m="-1px"
        overflow="hidden"
        clipPath="inset(50%)"
        whiteSpace="nowrap"
        borderWidth={0}
      >
        {label}
      </Box>
      {children}
    </Box>
  )
}

/** Home: greeting + featured card + side list. */
export function HomeSkeleton() {
  return (
    <ScreenSkeleton label="جاري تحميل الصفحة الرئيسية">
      <Box minH="100vh" py={4} px={6}>
        <VStack gap={3} mb={{ base: 8, lg: 10 }} mt={{ base: 3, lg: 5 }}>
          <Skeleton
            {...sk}
            height={{ base: "36px", lg: "56px" }}
            w="40%"
            borderRadius="md"
          />
          <Skeleton {...sk} height="20px" w="28%" borderRadius="md" />
        </VStack>

        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 6, lg: 10 }}
          maxW="1600px"
          mx="auto"
        >
          <Skeleton
            {...sk}
            flex={{ base: "1", lg: "1.3" }}
            minH={{ base: "220px", lg: "360px" }}
            borderRadius={{ base: "2xl", lg: "3xl" }}
          />
          <VStack flex="1" gap={4} align="stretch">
            <Skeleton {...sk} height="28px" w="50%" borderRadius="md" />
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                {...sk}
                height={{ base: "72px", lg: "88px" }}
                borderRadius="xl"
              />
            ))}
          </VStack>
        </Flex>
      </Box>
    </ScreenSkeleton>
  )
}

/** Programs catalog grid. */
export function ProgramsListSkeleton() {
  return (
    <ScreenSkeleton label="جاري تحميل البرامج">
      <Grid
        w="full"
        templateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }}
        columnGap={{ base: 4, lg: 8 }}
        rowGap={{ base: 10, lg: 12 }}
        pt={6}
        pb={10}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Flex
            key={i}
            justify={{
              base: i % 2 !== 0 ? "flex-end" : "flex-start",
              lg: "center",
            }}
            w="full"
          >
            <Skeleton
              {...sk}
              w={{ base: "70%", lg: "90%" }}
              minH={{ base: "120px", lg: "168px" }}
              borderRadius="8px"
            />
          </Flex>
        ))}
      </Grid>
    </ScreenSkeleton>
  )
}

/** Phases accordion cards. */
export function PhasesListSkeleton() {
  return (
    <ScreenSkeleton label="جاري تحميل المراحل">
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i}>
            <Skeleton
              {...sk}
              height={{ base: "72px", lg: "88px" }}
              borderRadius="md"
              mb={3}
            />
            {i === 0 ? (
              <VStack gap={3} align="stretch" ps={2}>
                <Skeleton {...sk} height="48px" borderRadius="md" />
                <Skeleton {...sk} height="48px" borderRadius="md" />
              </VStack>
            ) : null}
          </Box>
        ))}
      </Grid>
    </ScreenSkeleton>
  )
}

/** Book detail + lesson rows. */
export function BooksListSkeleton() {
  return (
    <ScreenSkeleton label="جاري تحميل الكتاب">
      <Box bg="white" borderRadius="4px" boxShadow="lg" p={8} w="full">
        <Skeleton
          {...sk}
          height={{ base: "28px", lg: "40px" }}
          w="55%"
          mb={6}
          borderRadius="md"
        />
        <Flex gap={4} mb={8}>
          <Skeleton {...sk} height="36px" w="120px" borderRadius="full" />
          <Skeleton {...sk} height="36px" w="120px" borderRadius="full" />
        </Flex>
        <VStack gap={3} align="stretch">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              {...sk}
              height={{ base: "56px", lg: "64px" }}
              borderRadius="md"
            />
          ))}
        </VStack>
      </Box>
    </ScreenSkeleton>
  )
}

/** Course player — same shell as CourseScreen (breakpoints, RTL split, player). */
export function CourseSkeleton() {
  return (
    <ScreenSkeleton label="جاري تحميل المقرر">
      <Box
        minH="100vh"
        dir="rtl"
        px={{ lg: "16" }}
        py={{ lg: "10" }}
        pb={{ base: "40", lg: "36" }}
        data-testid="course-skeleton"
      >
        {/* Header — matches Container maxW=container.lg */}
        <Box maxW="container.lg" mx="auto" px={8} py={4}>
          {/* Desktop: title + AppMenu + back */}
          <Flex
            display={{ base: "none", lg: "flex" }}
            direction="column"
            align="center"
            mb={4}
            gap={3}
          >
            <Flex
              position="relative"
              w="full"
              align="center"
              justify="center"
              minH="14"
            >
              <Box
                position="absolute"
                insetInlineStart={0}
                top="50%"
                transform="translateY(-50%)"
              >
                <SkeletonCircle size="12" css={sk.css} variant="pulse" />
              </Box>
              <Skeleton
                {...sk}
                height="56px"
                w="280px"
                maxW="55%"
                borderRadius="md"
              />
            </Flex>
            <Skeleton {...sk} height="20px" w="148px" borderRadius="md" />
          </Flex>

          {/* Mobile: back + menu */}
          <Flex
            display={{ base: "flex", lg: "none" }}
            align="center"
            justify="space-between"
            gap={2}
            mb={2}
          >
            <Skeleton {...sk} height="32px" w="148px" borderRadius="md" />
            <SkeletonCircle size="10" css={sk.css} variant="pulse" />
          </Flex>

          {/* Breadcrumbs */}
          <Flex gap={2} flexWrap="wrap" mb={2}>
            <Skeleton {...sk} height="14px" w="72px" borderRadius="sm" />
            <Skeleton {...sk} height="14px" w="56px" borderRadius="sm" />
            <Skeleton {...sk} height="14px" w="64px" borderRadius="sm" />
            <Skeleton {...sk} height="14px" w="48px" borderRadius="sm" />
          </Flex>
        </Box>

        {/* Mobile prev / lesson / next */}
        <Flex
          display={{ base: "flex", lg: "none" }}
          justify="space-between"
          align="center"
          mb={6}
          px={3}
        >
          <Skeleton {...sk} height="28px" w="72px" borderRadius="md" />
          <Skeleton {...sk} height="24px" w="80px" borderRadius="md" />
          <Skeleton {...sk} height="28px" w="72px" borderRadius="md" />
        </Flex>

        {/* Content card — same widths as CourseScreen */}
        <Box
          bg="white"
          w={{ base: "92%", lg: "100%" }}
          maxW={{ lg: "container.xl" }}
          mx="auto"
          mt={{ lg: "8" }}
          px={{ base: 4, md: 6 }}
          py={6}
          boxShadow="lg"
          borderRadius={4}
        >
          {/* PDF full width (notes UI deferred for v0). */}
          <Box w="full" minW={0}>
            <Box
              borderWidth="1px"
              borderColor="gray.100"
              borderRadius="md"
              overflow="hidden"
            >
              <Skeleton {...sk} height="40px" w="full" borderRadius={0} />
              <Skeleton
                {...sk}
                height={{ base: "380px", md: "520px" }}
                w="full"
                borderRadius={0}
              />
            </Box>
          </Box>
        </Box>

        {/* Fixed player — title, then seek row, then actions under the track */}
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          boxShadow="lg"
          zIndex={10}
          borderTopWidth="1px"
          borderColor="brand.secondary"
          px={{ base: 3, md: 6 }}
          pt={3}
          pb="calc(0.75rem + env(safe-area-inset-bottom, 0px))"
          dir="rtl"
        >
          <Flex align="center" justify="center" gap={1} mb={3}>
            <SkeletonCircle size="8" css={sk.css} variant="pulse" />
            <Skeleton
              {...sk}
              height="20px"
              w={{ base: "55%", md: "260px" }}
              maxW="md"
              borderRadius="md"
            />
            <SkeletonCircle size="8" css={sk.css} variant="pulse" />
          </Flex>

          <Box
            display="grid"
            w="full"
            dir="ltr"
            alignItems="center"
            columnGap={{ base: 2, md: 4 }}
            rowGap={{ base: 0.5, md: 0.5 }}
            gridTemplateColumns="auto 1fr auto"
            gridTemplateAreas={`
              "cur seek dur"
              ". controls ."
            `}
          >
            <Skeleton
              gridArea="cur"
              {...sk}
              height="12px"
              w={{ base: "36px", md: "40px" }}
              borderRadius="sm"
            />
            <Skeleton
              gridArea="seek"
              {...sk}
              height={{ base: "14px", md: "10px" }}
              w="full"
              borderRadius="full"
              my={{ base: 1, md: 1 }}
            />
            <Skeleton
              gridArea="dur"
              {...sk}
              height="12px"
              w={{ base: "40px", md: "44px" }}
              borderRadius="sm"
            />

            <Flex
              gridArea="controls"
              w="full"
              align="center"
              justify="space-between"
              gap={{ base: 1, md: 2 }}
            >
              <Skeleton
                {...sk}
                height={{ base: "28px", md: "32px" }}
                w={{ base: "36px", md: "40px" }}
                borderRadius="full"
              />
              <Flex align="center" justify="center" gap={{ base: 2, md: 3 }}>
                <SkeletonCircle
                  size={{ base: "10", md: "8" }}
                  css={sk.css}
                  variant="pulse"
                />
                <SkeletonCircle size="12" css={sk.css} variant="pulse" />
                <SkeletonCircle
                  size={{ base: "10", md: "8" }}
                  css={sk.css}
                  variant="pulse"
                />
              </Flex>
              <Flex align="center" gap={1}>
                <SkeletonCircle size="8" css={sk.css} variant="pulse" />
                <SkeletonCircle
                  size="8"
                  css={sk.css}
                  variant="pulse"
                  display={{ base: "none", md: "block" }}
                />
              </Flex>
            </Flex>
          </Box>
        </Box>
      </Box>
    </ScreenSkeleton>
  )
}
