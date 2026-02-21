import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

function mockSubmit(values: { email: string; password: string }) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      localStorage.setItem("access_token", "mock-student-token")
      localStorage.setItem(
        "mock_student_profile",
        JSON.stringify({
          email: values.email,
        }),
      )
      resolve()
    }, 600)
  })
}

export function useLoginWizard() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")
  const [error, setError] = useState<{
    email: string | null
    password: string | null
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = "أدخل معلومات الحساب"

  const canContinue = email.length > 0 && password.length > 0

  const validateCurrentStep = () => {
    if (canContinue) return true
    setError({
      email: !email.length ? "الرجاء إدخال بريدك الإلكتروني" : null,
      password: !password.length ? "الرجاء إدخال كلمة السر" : null,
    })
    return false
  }

  const next = async () => {
    setError(null)

    if (!validateCurrentStep()) return

    setIsSubmitting(true)
    try {
      await mockSubmit({ email, password })
      await navigate({ to: "/" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    title,
    error,
    isSubmitting,
    email,
    setEmail,
    password,
    setPassword,
    next,
  }
}
