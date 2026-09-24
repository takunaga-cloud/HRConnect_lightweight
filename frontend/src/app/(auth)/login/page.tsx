"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, Mail, User } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants";

import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter()
    const auth = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auth) return;

        setIsLoading(true)

        try {
            // Using AuthContext's new login method which calls Next.js proxy
            // @ts-ignore - Login signature changed
            await auth.login(email, password);

            toast.success("ログインしました");
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Login error:", error);
            toast.error(error.message || "ログインに失敗しました。ユーザーID・パスワードをご確認ください。");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">HR-Connect</CardTitle>
                    <CardDescription className="text-center">
                        ユーザーID（社員番号）またはメールアドレスとパスワードを入力してログインしてください。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">ユーザーID または メールアドレス</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="社員番号 または メールアドレス"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "サインイン中..." : "サインイン"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-gray-500">
                    パスワードをお忘れですか？人事部にお問い合わせください。
                </CardFooter>
            </Card>
        </div>
    )
}
