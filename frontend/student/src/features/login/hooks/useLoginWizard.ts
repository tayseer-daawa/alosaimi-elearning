import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { ApiError } from "@/client"
import { navigateOrLoad, SignInError, useSignIn } from "@/shared/api/useSignIn"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"

const loginRoute = getRouteApi("/_layout/login")

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
  const { registered } = loginRoute.useSearch()
  // Set by signup when the account was created but the automatic sign-in failed.
  const notice = registered ? "تم إنشاء الحساب، يرجى تسجيل الدخول" : null

  // Covers sign-in *and* the navigation after it, so the button stays busy
  // until the home screen loads. The ref also stops a second Enter press that
  // lands before the re-render.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inFlight = useRef(false)

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
    if (inFlight.current) return
    setError(null)

    if (!validateCurrentStep()) return

    inFlight.current = true
    setIsSubmitting(true)
    try {
      await signIn.mutateAsync({ email, password })
      await navigateOrLoad(() => navigate({ to: "/" }), "/")
    } catch (err: unknown) {
      setError({ email: signInErrorMessage(err), password: null })
    } finally {
      inFlight.current = false
      setIsSubmitting(false)
    }
  }

  return {
    title,
    notice,
    error,
    isSubmitting,
    email,
    setEmail,
    password,
    setPassword,
    next,
  }
}
