import { Button, Flex, Menu, Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
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
}

export function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const navigate = useNavigate()

  return (
    <nav aria-label="Breadcrumb">
      <Flex
        display={{ base: "flex", lg: "none" }}
        justify="start"
        align="center"
        fontSize="sm"
        color="gray.500"
        gap={1}
        mt={4}
        flexWrap="wrap"
      >
        {breadcrumbs.map((crumb, index) => (
          <Flex key={index} align="center" gap={1}>
            {crumb.hasDropdown && crumb.options ? (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    px={0}
                    fontWeight="medium"
                    color={crumb.isCurrent ? "brand.primary" : "gray.400"}
                    _hover={{ color: "brand.primary", bg: "transparent" }}
                    onClick={() => crumb.url && navigate({ to: crumb.url })}
                  >
                    {crumb.label}
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
                      <Flex key={i} direction="column">
                        <Menu.Item
                          value={`${index}-${i}`}
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          onClick={() => navigate({ to: option.url })}
                          _highlighted={{
                            color: "brand.primary",
                            bg: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <Text color="gray.400">{">"}</Text>
                          <Text>{option.label}</Text>
                        </Menu.Item>

                        {i < crumb.options!.length - 1 && <Menu.Separator />}
                      </Flex>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            ) : crumb.isCurrent ? (
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="brand.primary"
                px={1}
              >
                {crumb.label}
              </Text>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                px={0}
                color="gray.400"
                _hover={{ color: "brand.primary", bg: "transparent" }}
                onClick={() => crumb.url && navigate({ to: crumb.url })}
              >
                {crumb.label}
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
