import { useState } from "react"

function mockSubmit(values: { email: string }) {
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

export function useForgetPassword() {
  const [email, setEmail] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const canContinue = !!/\S+@\S+\.\S+/.test(email.trim())

  const validateCurrentStep = () => {
    if (canContinue) return true

    setError("الرجاء إدخال بريد إلكتروني صحيح")
    return false
  }

  const next = async () => {
    setError(null)
    setSuccess(false)
    if (!validateCurrentStep()) return
    setIsSubmitting(true)
    try {
      await mockSubmit({ email })
      setSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
    return
  }

  return {
    error,
    isSubmitting,
    email,
    setEmail,
    next,
    success,
  }
}
