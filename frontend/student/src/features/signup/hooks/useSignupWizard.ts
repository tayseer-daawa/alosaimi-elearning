import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { UsersService, ApiError } from "@/client"

type Step = "name" | "email" | "gender" | "goal" | "password"

const steps: Step[] = ["name", "email", "gender", "goal", "password"]



export function useSignupWizard() {
  const navigate = useNavigate()

  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex] ?? "name"

  const [firstName, setFirstName] = useState("")
  const [fatherName, setFatherName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [email, setEmail] = useState("")
  const [isMale, setIsMale] = useState<boolean | null>(null)
  const [wantsNotifications, setWantsNotifications] = useState<boolean | null>(
    null,
  )
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = "أدخل بعض المعلومات"

  const canContinue = useMemo(() => {
    switch (step) {
      case "name":
        return firstName.trim().length > 1 && fatherName.trim().length > 1 && familyName.trim().length > 1
      case "email":
        return /\S+@\S+\.\S+/.test(email.trim())
      case "gender":
        return isMale !== null
      case "goal":
        return wantsNotifications !== null
      case "password":
        return password.length >= 6 && password === confirmPassword
      default:
        return false
    }
  }, [step, firstName, fatherName, familyName, email, isMale, wantsNotifications, password, confirmPassword])

  const validateCurrentStep = () => {
    if (canContinue) return true

    switch (step) {
      case "name":
        setError("الرجاء إدخال الاسم الشخصي، اسم الأب، والاسم العائلي")
        return false
      case "email":
        setError("الرجاء إدخال بريد إلكتروني صحيح")
        return false
      case "gender":
        setError("الرجاء تحديد الجنس")
        return false
      case "goal":
        setError("الرجاء اختيار نعم أو لا")
        return false
      case "password":
        setError("كلمة السر يجب أن تكون 6 أحرف على الأقل وأن تتطابق مع التأكيد")
        return false
      default:
        return false
    }
  }

  const next = async () => {
    setError(null)

    if (!validateCurrentStep()) return

    if (step === "password") {
      setIsSubmitting(true)
      try {
        await UsersService.registerUser({
          requestBody: {
            first_name: firstName,
            father_name: fatherName,
            family_name: familyName,
            email: email,
            is_male: isMale as boolean,
            password: password,
          },
        })
        await navigate({ to: "/login" })
      } catch (err: any) {
        if (err instanceof ApiError) {
          const detail = err.body?.detail
          if (typeof detail === "string") {
            setError(detail)
          } else if (Array.isArray(detail) && detail.length > 0) {
            setError(detail[0].msg)
          } else {
            setError("حدث خطأ أثناء الاتصال بالخادم")
          }
        } else {
          setError("تعذر إنشاء الحساب، يرجى المحاولة لاحقاً")
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  return {
    step,
    title,
    error,
    isSubmitting,
    firstName,
    setFirstName,
    fatherName,
    setFatherName,
    familyName,
    setFamilyName,
    email,
    setEmail,
    isMale,
    setIsMale,
    wantsNotifications,
    setWantsNotifications,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  }
}
