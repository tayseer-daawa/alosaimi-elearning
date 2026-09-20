import {
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react"
import { LogOut } from "lucide-react"
import { logout } from "@/shared/lib/logout"
import MenuIcon from "/assets/menu.svg"

type AppMenuProps = {
  /** Absolute positioning when used in page headers */
  position?: "absolute" | "static"
}

export function AppMenu({ position = "absolute" }: AppMenuProps) {
  return (
    <Box
      position={position}
      right={position === "absolute" ? { base: 0, lg: 14 } : undefined}
      zIndex="10"
    >
      <Menu.Root
        positioning={{
          placement: "bottom-start",
          offset: { mainAxis: 8 },
        }}
      >
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            // Lock size so open/focus/active states cannot shift the icon.
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
            _open={{ bg: "transparent" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "brand.primary",
              outlineOffset: "2px",
            }}
            aria-label="القائمة الرئيسية"
            data-testid="app-menu-trigger"
          >
            <Image
              src={MenuIcon}
              alt=""
              boxSize={{ base: 6, lg: 10 }}
              objectFit="contain"
              pointerEvents="none"
            />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              minW="200px"
              p={2}
              borderRadius="xl"
              boxShadow="lg"
              bg="white"
              zIndex="popover"
              data-testid="app-menu-content"
            >
              <Menu.Item
                value="logout"
                color="red.500"
                cursor="pointer"
                onClick={() => logout()}
                _hover={{ bg: "red.50" }}
                borderRadius="md"
                data-testid="app-menu-logout"
              >
                <HStack gap={3} w="100%">
                  <Icon as={LogOut} boxSize={5} />
                  <Text fontWeight="600" fontSize="md">
                    تسجيل الخروج
                  </Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Box>
  )
}
