import { Box, Button, Flex, Skeleton, Text } from "@chakra-ui/react"
import { useState } from "react"
import type { UserPublic } from "@/client"
import { useCurrentUser } from "@/features/home/api/useCurrentUser"
import { getStudentProfile } from "@/shared/lib/authSession"
import { AccountPageShell } from "./AccountPageShell"

function fullName(user: UserPublic): string {
  return [user.first_name, user.father_name, user.family_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
}

const NOTIFY_KEY = "student_email_notifications"

function loadNotifyPref(): boolean {
  try {
    return localStorage.getItem(NOTIFY_KEY) === "1"
  } catch {
    return false
  }
}

export default function ProfileScreen() {
  const userQuery = useCurrentUser()
  const user = userQuery.data
  const cached = getStudentProfile()
  const name = user ? fullName(user) : cached?.first_name
  const email = user?.email ?? cached?.email
  const [notifyEmail, setNotifyEmail] = useState(loadNotifyPref)

  const setNotify = (value: boolean) => {
    setNotifyEmail(value)
    try {
      localStorage.setItem(NOTIFY_KEY, value ? "1" : "0")
    } catch {
      // ignore quota / private mode
    }
  }

  return (
    <AccountPageShell title="المعلومات الشخصية" testId="profile-screen">
      <Flex direction="column" gap={8} dir="rtl">
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1} textAlign="right">
            الاسم الكامل
          </Text>
          {userQuery.isPending ? (
            <Skeleton h="7" w="60%" ms="auto" />
          ) : (
            <Text
              fontSize="lg"
              color="brand.primary"
              fontWeight="medium"
              textAlign="right"
              data-testid="profile-name"
            >
              {name || "—"}
            </Text>
          )}
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1} textAlign="right">
            البريد الالكتروني
          </Text>
          <Text
            fontSize="lg"
            color="brand.primary"
            fontWeight="medium"
            textAlign="right"
            dir="ltr"
            data-testid="profile-email"
          >
            {email || "—"}
          </Text>
        </Box>

        <Box>
          <Text
            fontSize="md"
            color="brand.primary"
            mb={3}
            textAlign="right"
            lineHeight="tall"
          >
            هل تريد تلقي بعض الاشعارات على البريد الالكتروني؟
          </Text>
          <Flex gap={3} justify="flex-start" dir="rtl">
            <Button
              size="sm"
              bg={notifyEmail ? "brand.primary" : "gray.100"}
              color={notifyEmail ? "white" : "gray.700"}
              borderRadius="lg"
              onClick={() => setNotify(true)}
              data-testid="profile-notify-yes"
            >
              نعم
            </Button>
            <Button
              size="sm"
              bg={!notifyEmail ? "brand.primary" : "gray.100"}
              color={!notifyEmail ? "white" : "gray.700"}
              borderRadius="lg"
              onClick={() => setNotify(false)}
              data-testid="profile-notify-no"
            >
              لا
            </Button>
          </Flex>
        </Box>
      </Flex>
    </AccountPageShell>
  )
}
