import { Box, Button, HStack, Icon, Image, Menu, Text } from "@chakra-ui/react"
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
            p={2}
            _hover={{ bg: "transparent" }}
            aria-label="القائمة الرئيسية"
          >
            <Image
              src={MenuIcon}
              alt="أيقونة القائمة"
              boxSize={{ base: 6, lg: 12 }}
              objectFit="contain"
            />
          </Button>
        </Menu.Trigger>
        <Menu.Content
          minW="200px"
          p={2}
          borderRadius="xl"
          boxShadow="lg"
          bg="white"
          zIndex="popover"
        >
          <Menu.Item
            value="logout"
            color="red.500"
            cursor="pointer"
            onClick={() => logout()}
            _hover={{ bg: "red.50" }}
            borderRadius="md"
          >
            <HStack gap={3} w="100%">
              <Icon as={LogOut} boxSize={5} />
              <Text fontWeight="600" fontSize="md">
                تسجيل الخروج
              </Text>
            </HStack>
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </Box>
  )
}
