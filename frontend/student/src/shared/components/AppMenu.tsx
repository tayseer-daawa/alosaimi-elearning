import {
  Box,
  Button,
  Drawer,
  Flex,
  IconButton,
  Image,
  Portal,
  Text,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { ChevronLeft, LogOut, X } from "lucide-react"
import { useState } from "react"
import { getStudentProfile } from "@/shared/lib/authSession"
import { logout } from "@/shared/lib/logout"
import MenuIcon from "/assets/menu.svg"

type AppMenuProps = {
  /** Absolute positioning when used in page headers */
  position?: "absolute" | "static"
}

type NavItem = {
  label: string
  to: "/programs" | "/profile" | "/copyright" | "/help"
  testId: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "البرامج", to: "/programs", testId: "app-menu-nav-programs" },
  {
    label: "المعلومات الشخصية",
    to: "/profile",
    testId: "app-menu-nav-profile",
  },
  {
    label: "حقوق الملكية",
    to: "/copyright",
    testId: "app-menu-nav-copyright",
  },
  {
    label: "المساعدة و الدعم",
    to: "/help",
    testId: "app-menu-nav-help",
  },
]

export function AppMenu({ position = "absolute" }: AppMenuProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const profile = getStudentProfile()
  const greetingName = profile?.first_name?.trim() || "الطالب"

  const go = (to: NavItem["to"]) => {
    setOpen(false)
    void navigate({ to })
  }

  return (
    <>
      <Box
        position={position}
        right={position === "absolute" ? { base: 0, lg: 2 } : undefined}
        zIndex="10"
      >
        <Button
          variant="ghost"
          size="sm"
          boxSize={{ base: 10, lg: 14 }}
          minW={{ base: 10, lg: 14 }}
          h={{ base: 10, lg: 14 }}
          p={0}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          bg="transparent"
          _hover={{ bg: "transparent" }}
          _active={{ bg: "transparent" }}
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "brand.primary",
            outlineOffset: "2px",
          }}
          aria-label="القائمة الرئيسية"
          aria-expanded={open}
          data-testid="app-menu-trigger"
          onClick={() => setOpen(true)}
        >
          <Image
            src={MenuIcon}
            alt=""
            boxSize={{ base: 6, lg: 10 }}
            objectFit="contain"
            pointerEvents="none"
          />
        </Button>
      </Box>

      <Drawer.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        placement="start"
        size="sm"
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.400" />
          <Drawer.Positioner dir="rtl">
            <Drawer.Content
              dir="rtl"
              lang="ar"
              bg="white"
              display="flex"
              flexDirection="column"
              data-testid="app-menu-drawer"
            >
              <Drawer.Header pt={6} px={5} pb={4} position="relative">
                <Flex
                  dir="rtl"
                  align="flex-start"
                  justify="space-between"
                  gap={3}
                >
                  <Box flex="1" minW={0} textAlign="right" pe={10}>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="brand.primary"
                      data-testid="app-menu-greeting"
                    >
                      مرحبا {greetingName}
                    </Text>
                    {profile?.email ? (
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        mt={1}
                        dir="ltr"
                        textAlign="right"
                        data-testid="app-menu-email"
                      >
                        {profile.email}
                      </Text>
                    ) : null}
                  </Box>
                  {/*
                    Recipe CloseTrigger uses insetEnd → physical `right` here and
                    overlaps the RTL greeting. Pin to the drawer’s free edge (left).
                  */}
                  <Drawer.CloseTrigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      borderRadius="full"
                      flexShrink={0}
                      color="gray.400"
                      position="absolute"
                      top={4}
                      left={3}
                      right="auto"
                      aria-label="إغلاق"
                      data-testid="app-menu-close"
                    >
                      <X size={18} strokeWidth={2} />
                    </IconButton>
                  </Drawer.CloseTrigger>
                </Flex>
              </Drawer.Header>

              <Drawer.Body px={5} pt={2} pb={4} flex="1">
                <Flex direction="column" gap={1} dir="rtl">
                  {NAV_ITEMS.map((item) => (
                    <Button
                      key={item.to}
                      variant="ghost"
                      justifyContent="space-between"
                      h="12"
                      px={2}
                      borderRadius="lg"
                      color="brand.primary"
                      fontWeight="medium"
                      fontSize="md"
                      onClick={() => go(item.to)}
                      data-testid={item.testId}
                    >
                      <Text flex="1" textAlign="right">
                        {item.label}
                      </Text>
                      <ChevronLeft size={18} strokeWidth={2} aria-hidden />
                    </Button>
                  ))}
                </Flex>
              </Drawer.Body>

              <Drawer.Footer
                px={5}
                pb={8}
                pt={2}
                borderTopWidth="0"
                justifyContent="flex-start"
              >
                <Button
                  variant="ghost"
                  color="red.500"
                  h="12"
                  px={2}
                  borderRadius="lg"
                  fontWeight="semibold"
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                  data-testid="app-menu-logout"
                >
                  <Text>تسجيل الخروج</Text>
                  <LogOut size={18} strokeWidth={2} aria-hidden />
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  )
}
