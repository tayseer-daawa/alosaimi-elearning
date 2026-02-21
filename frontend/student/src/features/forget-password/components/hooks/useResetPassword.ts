import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"


function mockSubmit(values: {
    password: string
}) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            localStorage.setItem("access_token", "mock-student-token")

            resolve()
        }, 600)
    })
}

export function useResetPassword() {
    const navigate = useNavigate()



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


        setIsSubmitting(true)
        try {
            await mockSubmit({ password })
            await navigate({ to: "/login" })
        } finally {
            setIsSubmitting(false)
        }
        return


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
