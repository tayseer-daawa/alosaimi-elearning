import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { ApiError, LoginService, UsersService } from "@/client"

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
      const response = await LoginService.loginAccessToken({
        formData: {
          username: email,
          password: password,
        },
      })

      localStorage.setItem("access_token", response.access_token)

      const profile = await UsersService.readUserMe()
      localStorage.setItem(
        "mock_student_profile",
        JSON.stringify({ email: profile.email }),
      )

      await navigate({ to: "/" })
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({
          email: "البريد الإلكتروني أو كلمة السر غير صحيحة",
          password: null,
        })
      } else {
        setError({ email: "حدث خطأ غير متوقع للاتصال بالخادم", password: null })
      }
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
