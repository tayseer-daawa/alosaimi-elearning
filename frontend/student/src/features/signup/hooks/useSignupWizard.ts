import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ApiError, UsersService } from "@/client"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"

type Step = "name" | "email" | "gender" | "password"

const steps: Step[] = ["name", "email", "gender", "password"]

type SignupErrors = {
  firstName: string | null
  fatherName: string | null
  familyName: string | null
  email: string | null
  gender: string | null
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
  password: null,
  confirmPassword: null,
  form: null,
})

const isFilledName = (value: string) => value.trim().length > 1
const NAME_MAX = 30
const PASSWORD_MAX = 128

export function useSignupWizard() {
  const navigate = useNavigate()

  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex] ?? "name"

  const [firstName, setFirstName] = useState("")
  const [fatherName, setFatherName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [email, setEmail] = useState("")
  const [isMale, setIsMale] = useState<boolean | null>(null)
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
          isFilledName(familyName) &&
          firstName.trim().length <= NAME_MAX &&
          fatherName.trim().length <= NAME_MAX &&
          familyName.trim().length <= NAME_MAX
        )
      case "email":
        return /\S+@\S+\.\S+/.test(email.trim())
      case "gender":
        return isMale !== null
      case "password":
        return (
          password.length >= 8 &&
          password.length <= PASSWORD_MAX &&
          password === confirmPassword
        )
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
        } else if (firstName.trim().length > NAME_MAX) {
          nextErrors.firstName = `الاسم الشخصي يجب ألا يتجاوز ${NAME_MAX} حرفاً`
        }
        if (!isFilledName(fatherName)) {
          nextErrors.fatherName = "الرجاء إدخال اسم الأب"
        } else if (fatherName.trim().length > NAME_MAX) {
          nextErrors.fatherName = `اسم الأب يجب ألا يتجاوز ${NAME_MAX} حرفاً`
        }
        if (!isFilledName(familyName)) {
          nextErrors.familyName = "الرجاء إدخال الاسم العائلي"
        } else if (familyName.trim().length > NAME_MAX) {
          nextErrors.familyName = `الاسم العائلي يجب ألا يتجاوز ${NAME_MAX} حرفاً`
        }
        break
      case "email":
        nextErrors.email = "الرجاء إدخال بريد إلكتروني صحيح"
        break
      case "gender":
        nextErrors.gender = "الرجاء تحديد الجنس"
        break
      case "password":
        if (password.length < 8) {
          nextErrors.password = "كلمة السر يجب أن تكون 8 أحرف على الأقل"
        } else if (password.length > PASSWORD_MAX) {
          nextErrors.password = `كلمة السر يجب ألا تتجاوز ${PASSWORD_MAX} حرفاً`
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
            first_name: firstName.trim(),
            father_name: fatherName.trim(),
            family_name: familyName.trim(),
            email: email.trim(),
            is_male: isMale as boolean,
            password: password,
          },
        })
        await navigate({ to: "/login" })
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError({
            ...emptyErrors(),
            form: apiErrorMessage(err.body),
          })
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
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  }
}
