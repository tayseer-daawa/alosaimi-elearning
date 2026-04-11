import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { LoginService, ApiError } from "@/client"

export function useResetPassword() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { token?: string }
  const token = search.token

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = "تحديث كلمة السر"

  const canContinue = password.length >= 6 && password === confirmPassword

  const validateCurrentStep = () => {
    if (canContinue) return true

    setError("كلمة السر يجب أن تكون 6 أحرف على الأقل وأن تتطابق مع التأكيد")
    return false
  }

  const next = async () => {
    setError(null)

    if (!validateCurrentStep()) return

    console.log("Extracted token from URL Search Params:", token)

    if (!token) {
      console.warn("DEBUG: No token found. Stopping reset process.")
      setError("رابط إعادة تعيين كلمة المرور غير صالح أو مفقود.")
      return
    }

    setIsSubmitting(true)
    console.log("Attempting to reset password with token:", token)
    try {
      await LoginService.resetPassword({
        requestBody: {
          token: token,
          new_password: password
        }
      })
      console.log("Password reset successful! Navigating to login...")
      await navigate({ to: "/login" })
    } catch (err: any) {
      console.error("DEBUG: raw error from LoginService.resetPassword:", err)
      console.dir(err)
      
      if (err instanceof ApiError) {
        console.error("DEBUG: ApiError body:", err.body)
        const detail = err.body?.detail
        if (typeof detail === "string") {
          setError(detail)
        } else if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg)
        } else {
          setError("الرابط غير صالح أو منتهي الصلاحية.")
        }
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
