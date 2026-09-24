"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Download, Lock, LockOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface MonthlyClosing {
    id: string;
    year: number;
    month: number;
    status: string;
    closed_at: string | null;
}

export default function AdminExportsPage() {
    const { isAuthenticated } = useAuth() || {};
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [closingStatus, setClosingStatus] = useState<MonthlyClosing | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);


    const fetchClosingStatus = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/closings?limit=100`);
            if (res.ok) {
                const data: MonthlyClosing[] = await res.json();
                const target = data.find(c => c.year === parseInt(year) && c.month === parseInt(month));
                setClosingStatus(target || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClosingStatus();
    }, [isAuthenticated, year, month]);

    const handleExecuteClosing = async () => {
        if (!isAuthenticated) return;
        if (!confirm(`${year}年${month}月の締め処理を実行しますか？\n実行後は勤怠・申請データがロックされます（※現在の実装ではフラグ更新のみ）。`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/closings/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ year: parseInt(year), month: parseInt(month) })
            });
            if (res.ok) {
                toast.success("月次締め処理を完了しました");
                fetchClosingStatus();
            } else {
                toast.error("処理に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReopen = async () => {
        if (!isAuthenticated) return;
        if (!confirm(`${year}年${month}月の締め処理を解除しますか？`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/closings/reopen`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ year: parseInt(year), month: parseInt(month) })
            });

            if (res.ok) {
                toast.success("締め処理を解除しました");
                fetchClosingStatus();
            } else {
                toast.error("解除に失敗しました");
            }
        } catch (e) {
            toast.error("エラーが発生しました");
        } finally {
            setActionLoading(false);
        }
    }

    const handleDownload = async (type: "payroll" | "work-logs" | "applications") => {
        if (!isAuthenticated) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/exports/${type}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ year: parseInt(year), month: parseInt(month) })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${type}_${year}_${month}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success("ダウンロードを開始しました");
            } else {
                toast.error("ダウンロードに失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="データ出力"
                description="給与計算や工数分析用に、勤怠データ・日報データをCSV形式で出力します。"
                icon={Download}
            />

            <Card>
                <CardHeader>
                    <CardTitle>対象年月の選択</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[2023, 2024, 2025, 2026].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>締め処理ステータス</CardTitle>
                        <CardDescription>
                            締め処理を行うとデータがロックされます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">現在の状況</div>
                                <div className="text-xl font-bold flex items-center gap-2">
                                    {closingStatus?.status === "Closed" ? (
                                        <>
                                            <Lock className="h-5 w-5 text-red-500" />
                                            <span className="text-red-500">締済 (Closed)</span>
                                        </>
                                    ) : (
                                        <>
                                            <LockOpen className="h-5 w-5 text-green-500" />
                                            <span className="text-green-500">未締 (Open)</span>
                                        </>
                                    )}
                                </div>
                                {closingStatus?.closed_at && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        処理日時: {new Date(closingStatus.closed_at).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {closingStatus?.status === "Closed" ? (
                                <Button variant="outline" onClick={handleReopen} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="animate-spin" /> : "締め解除"}
                                </Button>
                            ) : (
                                <Button onClick={handleExecuteClosing} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="animate-spin" /> : "締め実行"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>データ出力</CardTitle>
                        <CardDescription>
                            集計データをCSV形式でダウンロードします。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => handleDownload("payroll")}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            給与計算用CSV (勤怠集計)
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => handleDownload("work-logs")}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            工数管理用CSV (プロジェクト別)
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => handleDownload("applications")}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            申請データCSV (共通レイアウト)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
