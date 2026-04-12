import { useState } from "react"
import { ApiError, LoginService } from "@/client"

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
      await LoginService.recoverPassword({ email })
      setSuccess(true)
    } catch (err: any) {
      if (err instanceof ApiError) {
        const detail = (err.body as any)?.detail
        if (typeof detail === "string") {
          setError(detail)
        } else if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg)
        } else {
          setError("حدث خطأ أثناء محاولة استرجاع كلمة المرور")
        }
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
