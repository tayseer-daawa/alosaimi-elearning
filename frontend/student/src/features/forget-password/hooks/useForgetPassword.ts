import { useState } from "react"
import { ApiError, LoginService } from "@/client"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"

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
      await LoginService.recoverPassword({
        email: email.trim(),
        app: "student",
      })
      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(
          apiErrorMessage(err.body, "حدث خطأ أثناء محاولة استرجاع كلمة المرور"),
        )
      } else {
        setError("تعذر الاتصال بالخادم")
      }
    } finally {
      setIsSubmitting(false)
    }
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
