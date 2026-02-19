import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthCard } from '../ui/AuthCard'
import { useNotification } from '../../contexts/NotificationContext'

const PASSWORD_MIN = 8
const PASSWORD_REGEX = {
  upper: /[A-Z]/,
  number: /\d/,
  symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
}

function isStrongPassword(p: string): boolean {
  return (
    p.length >= PASSWORD_MIN &&
    PASSWORD_REGEX.upper.test(p) &&
    PASSWORD_REGEX.number.test(p) &&
    PASSWORD_REGEX.symbol.test(p)
  )
}

function passwordErrors(p: string): string[] {
  const errs: string[] = []
  if (p.length > 0 && p.length < PASSWORD_MIN) errs.push(`At least ${PASSWORD_MIN} characters`)
  if (p.length > 0 && !PASSWORD_REGEX.upper.test(p)) errs.push('One capital letter')
  if (p.length > 0 && !PASSWORD_REGEX.number.test(p)) errs.push('One number')
  if (p.length > 0 && !PASSWORD_REGEX.symbol.test(p)) errs.push('One symbol')
  return errs
}

export const Register = () => {
  const { signUp, verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'details' | 'verify'>('details')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 'details') {
      if (!isStrongPassword(password)) {
        setError('Password must be at least 8 characters with one capital letter, one number, and one symbol.')
        return
      }
      setLoading(true)
      try {
        const session = await signUp(email, password)
        if (session) {
          showSuccess('Account created successfully!')
          navigate('/dashboard')
        } else {
          setStep('verify')
          showSuccess('Verification code sent to your email!')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sign up failed.'
        setError(msg)
        showError(msg)
      } finally {
        setLoading(false)
      }
    } else {
      if (otp.length !== 6) {
        setError('Please enter a 6-digit code.')
        return
      }
      setLoading(true)
      try {
        await verifyOtp(email, otp, 'signup')
        showSuccess('Account verified and created!')
        navigate('/dashboard')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Verification failed.'
        setError(msg)
        showError(msg)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleResend = async () => {
    setError(null)
    setLoading(true)
    try {
      await resendOtp(email, 'signup')
      showSuccess('New verification code sent!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }

  const pwdErrs = step === 'details' ? passwordErrors(password) : []

  return (
    <AuthCard
      mode={step === 'verify' ? 'verify-email' : 'signup'}
      title={step === 'verify' ? 'Verify your email' : 'Create your account'}
      subtitle={step === 'verify' ? `We've sent a code to ${email}` : 'Get started with MoneyGrid in seconds'}
      email={email}
      password={password}
      otp={otp}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onOtpChange={setOtp}
      onResendOtp={handleResend}
      showPassword={showPassword}
      onShowPasswordToggle={() => setShowPassword((p) => !p)}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitLabel={loading ? (step === 'verify' ? 'Verifying…' : 'Creating account…') : (step === 'verify' ? 'Verify' : 'Create account')}
      emailId="register-email"
      passwordId="register-password"
      emailAutoComplete="email"
      passwordAutoComplete="new-password"
      passwordMinLength={PASSWORD_MIN}
      passwordHint={step === 'details' ? "At least 8 characters, 1 capital letter, 1 number, 1 symbol." : undefined}
      passwordErrors={pwdErrs}
      onBackToLogin={step === 'verify' ? () => setStep('details') : undefined}
      footer={
        step === 'details' && (
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </>
        )
      }
    />
  )
}
