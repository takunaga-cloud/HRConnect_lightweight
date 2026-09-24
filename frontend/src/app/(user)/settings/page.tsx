"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { BACKEND_URL } from "@/lib/constants";

export default function SettingsPage() {
    const auth = useAuth()
    const { isAuthenticated } = auth || {}
    const user = auth?.user
    const [workRules, setWorkRules] = useState<any[]>([])
    const [loading, setLoading] = useState(false)


    const fetchWorkRules = async () => {
        if (!isAuthenticated) return
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/work-rules/`);
            if (res.ok) {
                const data = await res.json()
                setWorkRules(data)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchWorkRules()
    }, [isAuthenticated])

    const handleSaveRule = async (rule: any) => {
        if (!isAuthenticated) return
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/work-rules/${rule.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: rule.name,
                    config: rule.config
                })
            })
            if (res.ok) {
                alert("就業規則を保存しました")
                fetchWorkRules()
            } else {
                alert("保存に失敗しました")
            }
        } catch (e) {
            console.error(e)
            alert("エラーが発生しました")
        } finally {
            setLoading(false)
        }
    }

    const handleConfigChange = (index: number, key: string, value: any) => {
        const newRules = [...workRules]
        newRules[index].config = { ...newRules[index].config, [key]: parseInt(value) }
        setWorkRules(newRules)
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="設定"
                description="アカウント情報の確認およびシステム設定を行います。"
                icon={Settings}
            />

            <Tabs defaultValue="account" className="w-full max-w-3xl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="account">アカウント</TabsTrigger>
                    <TabsTrigger value="password">パスワード</TabsTrigger>
                    <TabsTrigger value="work-rules">就業規則</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    {/* Existing Account Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>アカウント設定</CardTitle>
                            <CardDescription>
                                プロフィール情報の変更ができます。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">氏名</Label>
                                <Input id="name" defaultValue={user?.name || "開発 太郎"} key={user?.name} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">メールアドレス</Label>
                                <Input id="email" defaultValue={user?.email || "user@example.com"} key={user?.email} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>変更を保存</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="password">
                    {/* Existing Password Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>パスワード</CardTitle>
                            <CardDescription>
                                パスワードを変更します。セキュリティのため定期的な変更を推奨します。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="current">現在のパスワード</Label>
                                <Input id="current" type="password" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="new">新しいパスワード</Label>
                                <Input id="new" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>パスワードを変更</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="work-rules">
                    {workRules.map((rule, i) => (
                        <Card key={rule.id} className="mb-4">
                            <CardHeader>
                                <CardTitle>{rule.name}</CardTitle>
                                <CardDescription>ID: {rule.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>打刻丸め単位（分）</Label>
                                        <Input
                                            type="number"
                                            value={rule.config.rounding_rule_minutes}
                                            onChange={(e) => handleConfigChange(i, "rounding_rule_minutes", e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">例: 15 (15分単位で切り上げ/切り捨て)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>自動休憩控除（分）</Label>
                                        <Input
                                            type="number"
                                            value={rule.config.auto_break_deduction_minutes}
                                            onChange={(e) => handleConfigChange(i, "auto_break_deduction_minutes", e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">例: 60 (長時間労働時に自動で60分休憩とみなす)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>遅刻許容時間（分）</Label>
                                        <Input
                                            type="number"
                                            value={rule.config.late_grace_period_minutes}
                                            onChange={(e) => handleConfigChange(i, "late_grace_period_minutes", e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">例: 5 (5分までは遅刻扱いしない)</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={() => handleSaveRule(rule)} disabled={loading}>設定を保存</Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {workRules.length === 0 && (
                        <div className="text-center p-4">就業規則が見つかりません。</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
