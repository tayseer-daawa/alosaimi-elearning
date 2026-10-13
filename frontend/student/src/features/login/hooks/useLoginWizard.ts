import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { ApiError } from "@/client"
import { SignInError, useSignIn } from "@/shared/api/useSignIn"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"

function signInErrorMessage(err: unknown): string {
  if (err instanceof SignInError) {
    if (err.stage === "profile") {
      return "تعذر تحميل بيانات الحساب، يرجى المحاولة مرة أخرى"
    }
    if (err.reason instanceof ApiError) return apiErrorMessage(err.reason.body)
  }
  return "حدث خطأ غير متوقع للاتصال بالخادم"
}

export function useLoginWizard() {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const search = useSearch({ strict: false })
  // Set by signup when the account was created but the automatic sign-in failed.
  const notice =
    search.registered === true ? "تم إنشاء الحساب، يرجى تسجيل الدخول" : null

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")
  const [error, setError] = useState<{
    email: string | null
    password: string | null
  } | null>(null)

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

    try {
      await signIn.mutateAsync({ email, password })
    } catch (err: unknown) {
      setError({ email: signInErrorMessage(err), password: null })
      return
    }

    await navigate({ to: "/" })
  }

  return {
    title,
    notice,
    error,
    isSubmitting: signIn.isPending,
    email,
    setEmail,
    password,
    setPassword,
    next,
  }
}
