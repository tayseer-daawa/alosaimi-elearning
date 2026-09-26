import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ApiError, LoginService, UsersService } from "@/client"
import { apiErrorMessage } from "@/shared/lib/apiErrorMessage"
import {
  ACCESS_TOKEN_KEY,
  clearAuthSession,
  setStudentProfile,
} from "@/shared/lib/authSession"
import { emailIssue, emailIssueMessage } from "../lib/emailRules"

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

type SignupField = Exclude<keyof SignupErrors, "form">

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

const fieldStep: Record<SignupField, Step> = {
  firstName: "name",
  fatherName: "name",
  familyName: "name",
  email: "email",
  gender: "gender",
  password: "password",
  confirmPassword: "password",
}

const apiFieldToSignupField: Record<string, SignupField> = {
  first_name: "firstName",
  father_name: "fatherName",
  family_name: "familyName",
  email: "email",
  is_male: "gender",
  password: "password",
}

function signupFieldFromApiError(body: unknown): SignupField | null {
  const detail = (body as { detail?: unknown } | null | undefined)?.detail

  if (typeof detail === "string") {
    return /already exists/i.test(detail) ? "email" : null
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const loc = (detail[0] as { loc?: unknown[] })?.loc
    const apiField = Array.isArray(loc) ? loc[loc.length - 1] : undefined
    if (typeof apiField === "string") {
      return apiFieldToSignupField[apiField] ?? null
    }
  }

  return null
}

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
        return emailIssue(email) === null
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
        nextErrors.email = emailIssueMessage(emailIssue(email) ?? "format")
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

  const showErrorOnStep = (field: SignupField | null, message: string) => {
    if (!field) {
      setError({ ...emptyErrors(), form: message })
      return
    }
    setError({ ...emptyErrors(), [field]: message })
    setStepIndex(steps.indexOf(fieldStep[field]))
  }

  const signInAfterSignup = async () => {
    try {
      const response = await LoginService.loginAccessToken({
        formData: { username: email.trim(), password },
      })
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token)
      const profile = await UsersService.readUserMe()
      setStudentProfile({
        email: profile.email,
        first_name: profile.first_name,
      })
      await navigate({ to: "/" })
    } catch {
      clearAuthSession()
      await navigate({ to: "/login" })
    }
  }

  const submit = async () => {
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
      await signInAfterSignup()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showErrorOnStep(
          signupFieldFromApiError(err.body),
          apiErrorMessage(err.body),
        )
      } else {
        showErrorOnStep(null, "تعذر إنشاء الحساب، يرجى المحاولة لاحقاً")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const next = async () => {
    if (isSubmitting) return
    setError(emptyErrors())

    if (!validateCurrentStep()) return

    if (step === "password") {
      await submit()
      return
    }

    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  const back = () => {
    if (isSubmitting) return
    setError(emptyErrors())
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  return {
    step,
    stepNumber: stepIndex + 1,
    stepCount: steps.length,
    canGoBack: stepIndex > 0,
    isLastStep: step === "password",
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
    back,
  }
}
