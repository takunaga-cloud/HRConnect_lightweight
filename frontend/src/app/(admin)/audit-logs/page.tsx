"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Loader2, Search, FileWarning } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BACKEND_URL } from "@/lib/constants"

interface AuditLog {
    timestamp: string
    user_name: string
    user_ip_address: string
    event_type: string
    target_resource_type: string
    target_resource_id: string | null
    result: string
    details: any
}

export default function AuditLogsPage() {
    const { isAuthenticated } = useAuth() || {}
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(false)
    const [eventTypeFilter, setEventTypeFilter] = useState("")


    const fetchLogs = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams()
            if (eventTypeFilter) params.append("event_type", eventTypeFilter)

            const res = await fetch(`${BACKEND_URL}/api/v1/audit-logs/?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs();
        }
    }, [isAuthenticated]); // dependency array

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="監査ログ"
                description="システム内で実行された設定変更や打刻操作の変更履歴を監査します。"
                icon={FileWarning}
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>システム操作履歴</CardTitle>
                        <div className="flex gap-2">
                            <Input
                                placeholder="イベントタイプで検索..."
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                                className="w-[200px]"
                            />
                            <Button onClick={fetchLogs} size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>日時</TableHead>
                                        <TableHead>ユーザー</TableHead>
                                        <TableHead>操作</TableHead>
                                        <TableHead>対象</TableHead>
                                        <TableHead>結果</TableHead>
                                        <TableHead>詳細</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">ログがありません。</TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss")}
                                                </TableCell>
                                                <TableCell>{log.user_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{log.event_type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.target_resource_type}
                                                    {log.target_resource_id && <span className="text-xs ml-1 text-gray-500">ID: ...{log.target_resource_id.slice(-4)}</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={log.result === "Success" ? "default" : "destructive"}>
                                                        {log.result}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                                    {JSON.stringify(log.details)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
