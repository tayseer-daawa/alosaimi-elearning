import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ApiError, UsersService } from "@/client"

type Step = "name" | "email" | "gender" | "goal" | "password"

const steps: Step[] = ["name", "email", "gender", "goal", "password"]

type SignupErrors = {
  firstName: string | null
  fatherName: string | null
  familyName: string | null
  email: string | null
  gender: string | null
  goal: string | null
  password: string | null
  confirmPassword: string | null
  form: string | null
}

const emptyErrors = (): SignupErrors => ({
  firstName: null,
  fatherName: null,
  familyName: null,
  email: null,
  gender: null,
  goal: null,
  password: null,
  confirmPassword: null,
  form: null,
})

const isFilledName = (value: string) => value.trim().length > 1

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
  const [error, setError] = useState<SignupErrors>(emptyErrors)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = "أدخل بعض المعلومات"

  const canContinue = useMemo(() => {
    switch (step) {
      case "name":
        return (
          isFilledName(firstName) &&
          isFilledName(fatherName) &&
          isFilledName(familyName)
        )
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
  }, [
    step,
    firstName,
    fatherName,
    familyName,
    email,
    isMale,
    wantsNotifications,
    password,
    confirmPassword,
  ])

  const validateCurrentStep = () => {
    if (canContinue) return true

    const nextErrors = emptyErrors()

    switch (step) {
      case "name":
        if (!isFilledName(firstName)) {
          nextErrors.firstName = "الرجاء إدخال الاسم الشخصي"
        }
        if (!isFilledName(fatherName)) {
          nextErrors.fatherName = "الرجاء إدخال اسم الأب"
        }
        if (!isFilledName(familyName)) {
          nextErrors.familyName = "الرجاء إدخال الاسم العائلي"
        }
        break
      case "email":
        nextErrors.email = "الرجاء إدخال بريد إلكتروني صحيح"
        break
      case "gender":
        nextErrors.gender = "الرجاء تحديد الجنس"
        break
      case "goal":
        nextErrors.goal = "الرجاء اختيار نعم أو لا"
        break
      case "password":
        if (password.length < 6) {
          nextErrors.password = "كلمة السر يجب أن تكون 6 أحرف على الأقل"
        }
        if (!confirmPassword.trim().length) {
          nextErrors.confirmPassword = "الرجاء تأكيد كلمة السر"
        } else if (password !== confirmPassword) {
          nextErrors.confirmPassword = "كلمة السر غير متطابقة مع التأكيد"
        }
        break
      default:
        break
    }

    setError(nextErrors)
    return false
  }

  const next = async () => {
    setError(emptyErrors())

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
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          const detail = (err.body as { detail?: unknown } | undefined)?.detail
          if (typeof detail === "string") {
            setError({ ...emptyErrors(), form: detail })
          } else if (Array.isArray(detail) && detail.length > 0) {
            const first = detail[0] as { msg?: string }
            setError({
              ...emptyErrors(),
              form: first.msg ?? "حدث خطأ أثناء الاتصال بالخادم",
            })
          } else {
            setError({
              ...emptyErrors(),
              form: "حدث خطأ أثناء الاتصال بالخادم",
            })
          }
        } else {
          setError({
            ...emptyErrors(),
            form: "تعذر إنشاء الحساب، يرجى المحاولة لاحقاً",
          })
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
