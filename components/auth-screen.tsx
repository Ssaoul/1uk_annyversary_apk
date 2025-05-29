"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthService, type SignUpData, type SignInData } from "@/lib/auth-service"
import { toast } from "sonner"

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signInData, setSignInData] = useState<SignInData>({
    email: "",
    password: "",
  })

  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: "",
    password: "",
    name: "",
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await AuthService.signIn(signInData)

      if (result.success && result.user && result.sessionToken) {
        AuthService.setCurrentUser(result.user, result.sessionToken)
        toast.success(`환영합니다, ${result.user.name}님!`)
        onAuthSuccess(result.user)
      } else {
        setError(result.error || "로그인에 실패했습니다.")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 비밀번호 검증
    if (signUpData.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.")
      setLoading(false)
      return
    }

    try {
      const result = await AuthService.signUp(signUpData)

      if (result.success && result.user) {
        toast.success("회원가입이 완료되었습니다! 이제 로그인해주세요.")
        setMode("signin")
        setSignInData({ email: signUpData.email, password: "" })
      } else {
        setError(result.error || "회원가입에 실패했습니다.")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setError("회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await AuthService.signIn({ email: "demo@example.com", password: "password123" })

      if (result.success && result.user) {
        toast.success(`환영합니다, ${result.user.name}님!`)
        onAuthSuccess(result.user)
      } else {
        setError("데모 로그인에 실패했습니다.")
      }
    } catch (error) {
      console.error("Demo login error:", error)
      setError("데모 로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3F51B5] to-[#5C6BC0] p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="h-8 w-8 text-[#3F51B5]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">기념일 관리</h1>
          <p className="text-white/80">소중한 사람들의 기념일을 체계적으로 관리하세요</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{mode === "signin" ? "로그인" : "회원가입"}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 빠른 데모 로그인 */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                <Heart className="h-4 w-4" />
                데모 계정으로 바로 시작하기
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>
            </div>

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#3F51B5] hover:bg-[#3F51B5]/90" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8자 이상의 비밀번호"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">비밀번호는 8자 이상이어야 합니다.</p>
                </div>

                <Button type="submit" className="w-full bg-[#3F51B5] hover:bg-[#3F51B5]/90" disabled={loading}>
                  {loading ? "가입 중..." : "회원가입"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {/* 모드 전환 */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin")
                  setError(null)
                }}
                className="text-[#3F51B5] p-0 h-auto font-medium"
              >
                {mode === "signin" ? "회원가입하기" : "로그인하기"}
              </Button>
            </div>

            {/* 데모 계정 안내 */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">테스트용 계정: demo@example.com / password123</p>
            </div>
          </CardContent>
        </Card>

        {/* 하단 정보 */}
        <div className="text-center mt-6 text-white/60 text-sm">
          <p>© 2024 기념일 관리. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  )
}
