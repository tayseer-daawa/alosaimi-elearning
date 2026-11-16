import { Box, Dialog, Flex, IconButton, Text } from "@chakra-ui/react"
import { Keyboard, X } from "lucide-react"
import { PLAYER_SHORTCUTS } from "../lib/playerShortcuts"

type PlayerShortcutsHelpProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PlayerShortcutsHelp({
  open,
  onOpenChange,
}: PlayerShortcutsHelpProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      placement="center"
      motionPreset="scale"
      size="sm"
      closeOnEscape
    >
      <Dialog.Trigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          h="8"
          minW="8"
          p={0}
          borderRadius="full"
          color="brand.secondary"
          display={{ base: "none", md: "inline-flex" }}
          aria-label="اختصارات لوحة المفاتيح"
          data-testid="audio-shortcuts"
        >
          <Keyboard size={20} />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <Dialog.Positioner dir="rtl">
        <Dialog.Content
          dir="rtl"
          lang="ar"
          mx={4}
          borderRadius="xl"
          position="relative"
          pt={2}
          data-testid="audio-shortcuts-panel"
        >
          <Dialog.CloseTrigger
            position="absolute"
            top="3"
            left="3"
            right="auto"
            zIndex={1}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            boxSize="8"
            minW="8"
            w="8"
            p={0}
            border="none"
            borderRadius="full"
            bg="transparent"
            color="gray.500"
            cursor="pointer"
            _hover={{ bg: "blackAlpha.100", color: "gray.800" }}
            aria-label="إغلاق"
            data-testid="audio-shortcuts-close"
          >
            <X size={16} strokeWidth={2} />
          </Dialog.CloseTrigger>

          <Dialog.Header
            dir="rtl"
            display="flex"
            justifyContent="flex-start"
            w="full"
            ps={6}
            pe={2}
            pl={10}
          >
            <Dialog.Title
              fontSize="md"
              color="brand.primary"
              fontWeight="bold"
              w="full"
              textAlign="right"
              pe={1}
              data-testid="audio-shortcuts-title"
            >
              اختصارات المشغّل
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body pt={0} pb={5} dir="rtl">
            <Dialog.Description
              fontSize="xs"
              color="gray.500"
              mb={4}
              w="full"
              textAlign="right"
              dir="rtl"
            >
              استخدم لوحة المفاتيح للتحكم السريع أثناء الاستماع.
            </Dialog.Description>
            <Flex direction="column" gap={2.5} dir="rtl">
              {PLAYER_SHORTCUTS.map((row) => (
                <Flex
                  key={row.keys}
                  justify="space-between"
                  align="center"
                  gap={4}
                  dir="rtl"
                  w="full"
                >
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    flex="1"
                    textAlign="right"
                  >
                    {row.action}
                  </Text>
                  <Box
                    as="kbd"
                    fontSize="xs"
                    fontWeight="bold"
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    bg="gray.100"
                    color="brand.primary"
                    whiteSpace="nowrap"
                    fontFamily="mono"
                    flexShrink={0}
                    dir="ltr"
                  >
                    {row.keys}
                  </Box>
                </Flex>
              ))}
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
