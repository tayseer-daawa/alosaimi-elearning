import { Box, Dialog, Flex, IconButton, Text } from "@chakra-ui/react"
import { Keyboard, X } from "lucide-react"

export const PLAYER_SHORTCUTS = [
  { keys: "مسافة / K", action: "تشغيل أو إيقاف" },
  { keys: "← / →", action: "ترجيع أو تقديم ٥ ثوانٍ" },
  { keys: "J / L", action: "ترجيع أو تقديم ١٠ ثوانٍ" },
  { keys: "M", action: "كتم الصوت أو إلغاؤه" },
  { keys: "↑ / ↓", action: "رفع أو خفض الصوت" },
  { keys: "Shift + N", action: "الدرس التالي" },
  { keys: "Shift + P", action: "الدرس السابق" },
  { keys: "؟", action: "عرض اختصارات لوحة المفاتيح" },
] as const

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
          color="brand.secondary"
          aria-label="اختصارات لوحة المفاتيح"
          data-testid="audio-shortcuts"
        >
          <Keyboard size={20} />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <Dialog.Positioner>
        <Dialog.Content
          dir="rtl"
          mx={4}
          borderRadius="xl"
          position="relative"
          pt={2}
          data-testid="audio-shortcuts-panel"
        >
          <Dialog.CloseTrigger
            position="absolute"
            top="3"
            insetEnd="3"
            zIndex={1}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            boxSize="8"
            minW="8"
            w="8"
            p={0}
            border="none"
            borderRadius="md"
            bg="transparent"
            color="gray.500"
            cursor="pointer"
            _hover={{ bg: "blackAlpha.100", color: "gray.800" }}
            aria-label="إغلاق"
            data-testid="audio-shortcuts-close"
          >
            <X size={16} strokeWidth={2} />
          </Dialog.CloseTrigger>

          <Dialog.Header pe={10}>
            <Dialog.Title fontSize="md" color="brand.primary" fontWeight="bold">
              اختصارات المشغّل
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body pt={0} pb={5}>
            <Dialog.Description fontSize="xs" color="gray.500" mb={4}>
              استخدم لوحة المفاتيح للتحكم السريع أثناء الاستماع.
            </Dialog.Description>
            <Flex direction="column" gap={2.5}>
              {PLAYER_SHORTCUTS.map((row) => (
                <Flex
                  key={row.keys}
                  justify="space-between"
                  align="center"
                  gap={4}
                >
                  <Text fontSize="sm" color="gray.700" flex="1">
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
