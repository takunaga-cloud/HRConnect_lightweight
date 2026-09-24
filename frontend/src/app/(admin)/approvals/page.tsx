"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Loader2, Check, X, FileCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { toast } from "sonner"
import { BACKEND_URL } from "@/lib/constants"

interface Application {
    id: string;
    type: string;
    status: string;
    created_at: string;
    description: string | null;
    user_id: string;
    input_data?: any;
    user?: {
        id: string;
        name: string;
        user_id?: string;
    };
}

export default function AdminApprovalsPage() {
    const { isAuthenticated } = useAuth() || {}
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)


    const fetchApplications = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/applications/");
            if (res.ok) {
                const data = await res.json();
                // Filter for Pending (case sensitive match with backend)
                const pending = data.filter((app: Application) => app.status === "Pending");
                setApplications(pending);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApplications();
    }, [isAuthenticated, BACKEND_URL]);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        if (!isAuthenticated) return;
        setActionLoading(id);
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/applications/" + id + "/" + action, {
                method: "PATCH"
            });
            if (res.ok) {
                // Remove from list
                setApplications((prev: Application[]) => prev.filter((app: Application) => app.id !== id));
                toast.success(action === "approve" ? "承認しました" : "却下しました");
            } else {
                const errorData = await res.json().catch(() => ({ detail: "不明なエラー" }));
                console.error("Failed to " + action, errorData);
                toast.error(`${action === "approve" ? "承認" : "却下"}に失敗しました`, {
                    description: errorData.detail || "エラーが発生しました"
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="申請管理"
                description="メンバーから提出された有給取得申請や打刻修正申請を一括で審査・承認します。"
                icon={FileCheck}
            />

            <Card>
                <CardHeader>
                    <CardTitle>申請件数 ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : applications.length === 0 ? (
                        <p className="text-muted-foreground">承認待ちの申請はありません。</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">従業員番号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">従業員名</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請日</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請番号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請内容</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請理由</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">承認フラグ</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.map((app, index) => (
                                        <tr key={app.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.user?.user_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {app.user?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(app.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                                {app.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {app.type === 'PaidLeave' ? '有給休暇' :
                                                    app.type === 'Overtime' ? '残業申請' :
                                                        app.type === 'StampCorrection' ? '打刻修正' : app.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                                {app.input_data?.reason || app.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    承認待ち
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleAction(app.id, "approve")}
                                                        disabled={!!actionLoading}
                                                    >
                                                        {actionLoading === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                                        承認
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleAction(app.id, "reject")}
                                                        disabled={!!actionLoading}
                                                    >
                                                        {actionLoading === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                                        却下
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
