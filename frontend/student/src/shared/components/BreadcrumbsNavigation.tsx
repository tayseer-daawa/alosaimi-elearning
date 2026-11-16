import { Button, Flex, Menu, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

type BreadcrumbOption = {
  label: string
  url: string
}

type Breadcrumb = {
  label: string
  url?: string
  isCurrent?: boolean
  hasDropdown?: boolean
  options?: BreadcrumbOption[]
}

type BreadcrumbsProps = {
  breadcrumbs: Breadcrumb[]
  /**
   * On narrow screens, keep a single scrollable row instead of wrapping
   * into a tall stack that pushes content down.
   */
  compact?: boolean
}

export function Breadcrumbs({
  breadcrumbs,
  compact = false,
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <Flex
        display={{ base: "flex", lg: "none" }}
        justify="start"
        align="center"
        fontSize="sm"
        color="gray.500"
        gap={1}
        mt={compact ? 1 : 2}
        mb={compact ? 0 : 1}
        flexWrap={compact ? "nowrap" : "wrap"}
        overflowX={compact ? "auto" : undefined}
        overflowY="hidden"
        css={
          compact
            ? {
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }
            : undefined
        }
        maxW="full"
        pb={1}
      >
        {breadcrumbs.map((crumb, index) => (
          <Flex
            key={`${crumb.label}-${index}`}
            align="center"
            gap={1}
            flexShrink={0}
          >
            {crumb.hasDropdown && crumb.options ? (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    px={1}
                    h="8"
                    minH="8"
                    fontWeight="medium"
                    color={crumb.isCurrent ? "brand.primary" : "gray.400"}
                    _hover={{ color: "brand.primary", bg: "transparent" }}
                  >
                    <Text as="span" lineClamp={1} maxW="9rem">
                      {crumb.label}
                    </Text>
                  </Button>
                </Menu.Trigger>

                <Menu.Positioner>
                  <Menu.Content
                    minW="120px"
                    borderRadius="lg"
                    boxShadow="md"
                    py={1}
                    dir="rtl"
                  >
                    {crumb.options.map((option, i) => (
                      <Flex key={option.url} direction="column">
                        <Menu.Item
                          asChild
                          value={`${index}-${i}`}
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          _highlighted={{
                            color: "brand.primary",
                            bg: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <Link to={option.url}>
                            <Text as="span" color="gray.400">
                              {">"}
                            </Text>
                            <Text as="span">{option.label}</Text>
                          </Link>
                        </Menu.Item>

                        {i < crumb.options!.length - 1 && <Menu.Separator />}
                      </Flex>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            ) : crumb.isCurrent || !crumb.url ? (
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={crumb.isCurrent ? "brand.primary" : "gray.400"}
                px={1}
                lineClamp={1}
                maxW="9rem"
              >
                {crumb.label}
              </Text>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                px={1}
                h="8"
                minH="8"
                color="gray.400"
                _hover={{ color: "brand.primary", bg: "transparent" }}
              >
                <Link to={crumb.url}>
                  <Text as="span" lineClamp={1} maxW="9rem">
                    {crumb.label}
                  </Text>
                </Link>
              </Button>
            )}

            {index < breadcrumbs.length - 1 ? (
              <ChevronLeft
                size={14}
                aria-hidden
                color="var(--chakra-colors-gray-400)"
              />
            ) : null}
          </Flex>
        ))}
      </Flex>
    </nav>
  )
}
