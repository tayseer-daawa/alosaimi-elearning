import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { ApiError, LoginService } from "@/client"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"

export function useResetPassword() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const token = typeof search.token === "string" ? search.token : undefined

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = "تحديث كلمة السر"

  const canContinue = password.length >= 8 && password === confirmPassword

  const validateCurrentStep = () => {
    if (canContinue) return true

    setError("كلمة السر يجب أن تكون 8 أحرف على الأقل وأن تتطابق مع التأكيد")
    return false
  }

  const next = async () => {
    setError(null)

    if (!validateCurrentStep()) return

    if (!token) {
      setError("رابط إعادة تعيين كلمة المرور غير صالح أو مفقود.")
      return
    }

    setIsSubmitting(true)
    try {
      await LoginService.resetPassword({
        requestBody: {
          token: token,
          new_password: password,
        },
      })
      await navigate({ to: "/login" })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(
          apiErrorMessage(err.body, "الرابط غير صالح أو منتهي الصلاحية."),
        )
      } else {
        setError("تعذر الاتصال بالخادم")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    title,
    error,
    isSubmitting,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  }
}
