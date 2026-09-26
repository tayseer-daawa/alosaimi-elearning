import { Button, Dialog, Flex, Portal, Text } from "@chakra-ui/react"
import type { ProgramSessionPublic } from "@/client"
import { sessionStartLabel } from "../lib/enrollmentState"

type EnrollConfirmDialogProps = {
  session: ProgramSessionPublic | null
  programTitle: string | undefined
  isPending: boolean
  errorMessage: string | null
  onConfirm: (sessionId: string) => void
  onClose: () => void
}

export function EnrollConfirmDialog({
  session,
  programTitle,
  isPending,
  errorMessage,
  onConfirm,
  onClose,
}: EnrollConfirmDialogProps) {
  return (
    <Dialog.Root
      open={session !== null}
      onOpenChange={(details) => {
        if (!details.open && !isPending) onClose()
      }}
      placement="center"
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <Dialog.Positioner dir="rtl" px={4}>
          <Dialog.Content
            maxW="lg"
            borderRadius="md"
            data-testid="enroll-confirm-dialog"
          >
            <Dialog.Header pb={2}>
              <Dialog.Title
                fontSize={{ base: "xl", lg: "2xl" }}
                color="brand.primary"
              >
                تأكيد التسجيل
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description
                fontSize={{ base: "md", lg: "lg" }}
                color="text.default"
                lineHeight="tall"
              >
                {programTitle
                  ? `هل تريد التسجيل في دورة «${programTitle}»؟`
                  : "هل تريد التسجيل في هذه الدورة؟"}
              </Dialog.Description>
              {session ? (
                <Text
                  mt={2}
                  fontSize={{ base: "md", lg: "lg" }}
                  fontWeight="semibold"
                  color="brand.secondary"
                >
                  {sessionStartLabel(session)}
                </Text>
              ) : null}
              {errorMessage ? (
                <Text
                  mt={4}
                  color="red.600"
                  fontSize={{ base: "md", lg: "lg" }}
                  role="alert"
                  data-testid="enrollment-error"
                >
                  {errorMessage}
                </Text>
              ) : null}
            </Dialog.Body>
            <Dialog.Footer>
              <Flex
                w="full"
                direction={{ base: "column", sm: "row" }}
                gap={3}
                justify="flex-start"
              >
                <Button
                  flex={{ sm: "1" }}
                  loading={isPending}
                  onClick={() => session && onConfirm(session.id)}
                  data-testid="enroll-confirm"
                >
                  نعم، سجّلني
                </Button>
                <Button
                  variant="ghost"
                  flex={{ sm: "1" }}
                  borderWidth="1px"
                  borderColor="brand.lightGray"
                  disabled={isPending}
                  onClick={onClose}
                  data-testid="enroll-cancel"
                >
                  إلغاء
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
