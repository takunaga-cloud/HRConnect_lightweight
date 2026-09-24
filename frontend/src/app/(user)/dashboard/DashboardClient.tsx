"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, Briefcase, Calendar as CalendarIcon, FileText, AlertTriangle, LayoutGrid } from "lucide-react"
// import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

interface DashboardSummary {
    status: "NotClockedIn" | "ClockedIn" | "ClockedOut";
    clock_in_time: string | null;
    clock_out_time: string | null;
    total_hours_month: number;
    overtime_hours_month: number;
    next_holiday: string;
    pending_apps_count: number;
    recent_logs: {
        project_name: string;
        task_name: string;
        minutes: number;
        status: string;
    }[];
    alerts?: {
        level: "info" | "warning" | "critical";
        type: string;
        message: string;
        details?: any;
    }[];
}

import { BACKEND_URL } from "@/lib/constants";

interface DashboardClientProps {
    user: any;
    summary: DashboardSummary;
}

export default function DashboardClient({ user, summary }: DashboardClientProps) {
    const router = useRouter()
    const isClockedOut = summary?.status === "ClockedOut";

    return (
        <motion.div
            className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 container mx-auto max-w-7xl min-w-0 w-full overflow-hidden"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <PageHeader
                title="ダッシュボード"
                description={`ようこそ、 ${user?.username || ""} さん。本日の打刻状況や稼働サマリー、各種申請状態を一覧で確認できます。`}
                icon={LayoutGrid}
            />

            {/* Alerts Section */}
            {summary?.alerts && summary.alerts.length > 0 && (
                <div className="space-y-2">
                    {summary.alerts.map((alert, index) => (
                        <motion.div key={index} variants={item}>
                            <Alert
                                variant={alert.level === "critical" ? "destructive" : "default"}
                                className={alert.level === "warning" ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10" : ""}
                            >
                                <AlertTriangle className={`h-4 w-4 ${alert.level === "warning" ? "text-amber-600 dark:text-amber-400" : ""}`} />
                                <AlertTitle className="text-sm font-semibold">
                                    {alert.level === "critical" ? "警告 (上限超過)" : alert.level === "warning" ? "注意" : "情報"}
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                    {alert.message}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* スマホでも左右2カラム並びにするメイン上部エリア */}
            <motion.div variants={item} className="grid grid-cols-2 gap-2 sm:gap-4">
                
                {/* 左側: 出勤ステータス (コンパクトカード) */}
                <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-sm bg-gradient-to-br from-card to-indigo-50/30 dark:to-indigo-950/20 p-2.5 sm:p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0" />
                                出勤ステータス
                            </span>
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${
                                summary?.status === "ClockedIn"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    : summary?.status === "ClockedOut"
                                    ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            }`}>
                                {summary?.status === "ClockedIn" ? "出勤中" : summary?.status === "ClockedOut" ? "退勤済み" : "未出勤"}
                            </span>
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {summary?.status === "ClockedIn" ? "出勤中" : summary?.status === "ClockedOut" ? "退勤済み" : "未打刻"}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                            記録: <span className="font-semibold text-slate-700 dark:text-slate-300">{
                                summary?.clock_in_time ? (
                                    `${new Date(summary.clock_in_time).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit', hour12: false })} 〜 ${summary?.clock_out_time ? new Date(summary.clock_out_time).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit', hour12: false }) : "--:--"}`
                                ) : "データなし"
                            }</span>
                        </p>
                    </div>
                    <Button 
                        disabled={isClockedOut}
                        className="w-full mt-2 sm:mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 sm:py-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500 shadow-sm"
                        onClick={() => router.push("/stamp")}
                    >
                        {isClockedOut ? "打刻完了" : "打刻へ"}
                    </Button>
                </Card>

                {/* 右側: クイック操作 (見やすい高コントラストボタン) */}
                <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-sm p-2.5 sm:p-4 flex flex-col justify-between bg-card">
                    <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 flex items-center gap-1">
                        <span>⚡ クイック操作</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 h-full">
                        <Button 
                            variant="outline" 
                            disabled={isClockedOut}
                            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 h-full py-1.5 sm:py-2 px-2 bg-white dark:bg-slate-900 hover:bg-indigo-50/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={() => router.push("/stamp")}
                        >
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs font-semibold">打刻</span>
                        </Button>

                        <Button 
                            variant="outline" 
                            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 h-full py-1.5 sm:py-2 px-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                            onClick={() => router.push("/daily-report")}
                        >
                            <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-semibold">日報入力</span>
                        </Button>

                        <Button 
                            variant="outline" 
                            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 h-full py-1.5 sm:py-2 px-2 bg-white dark:bg-slate-900 hover:bg-amber-50/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                            onClick={() => router.push("/applications")}
                        >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-xs font-semibold">申請作成</span>
                        </Button>
                    </div>
                </Card>

            </motion.div>

            {/* 中段: 3カラムのミニサマリーカード */}
            <motion.div variants={item} className="grid grid-cols-3 gap-2 sm:gap-3">
                <Card 
                    className="cursor-pointer hover:border-indigo-500/50 transition-all p-2.5 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 bg-card shadow-sm"
                    onClick={() => router.push("/applications")}
                >
                    <div className="relative">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                        {(summary?.pending_apps_count ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1 rounded-full">
                                {summary?.pending_apps_count}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold">申請承認待ち</span>
                    <span className="text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {summary?.pending_apps_count ?? 0} 件
                    </span>
                </Card>

                <Card className="p-2.5 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 bg-card shadow-sm">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    <span className="text-[11px] sm:text-xs font-semibold">今月の勤務時間</span>
                    <span className="text-xs sm:text-sm font-extrabold">
                        {summary?.total_hours_month ?? 0} 時間
                    </span>
                </Card>

                <Card className="p-2.5 sm:p-3 flex flex-col items-center justify-center text-center space-y-1 bg-card shadow-sm">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    <span className="text-[11px] sm:text-xs font-semibold">有給残日数</span>
                    <span className="text-xs sm:text-sm font-extrabold">
                        {summary?.next_holiday ?? "-"}
                    </span>
                </Card>
            </motion.div>

            {/* 下段（スクロール領域）: 最近の日報リスト */}
            <motion.div variants={item}>
                <Card className="h-full shadow-sm">
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            最近の日報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-1 sm:pt-2">
                        <div className="space-y-2 sm:space-y-3">
                            {summary?.recent_logs.length === 0 ? (
                                <p className="text-xs sm:text-sm text-muted-foreground py-3 text-center">最近の日報登録はありません。</p>
                            ) : (
                                summary?.recent_logs.map((log: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                                        <div className="space-y-0.5 min-w-0 pr-2">
                                            <p className="text-xs sm:text-sm font-semibold truncate">{log.project_name}</p>
                                            <p className="text-[11px] sm:text-xs text-muted-foreground">{log.task_name || "作業"}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                {(log.minutes / 60).toFixed(1)} 時間
                                            </span>
                                            <span className="text-[11px] sm:text-xs text-muted-foreground">{log.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

        </motion.div>
    )
}
