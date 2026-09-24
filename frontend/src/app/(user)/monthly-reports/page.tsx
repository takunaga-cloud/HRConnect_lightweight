"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, ClipboardList } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { joinUrl, cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

// Types based on backend extensions
interface ProjectBase {
    name: string;
}

interface TaskCategoryBase {
    name: string;
}

interface WorkLogWithDetails {
    log_date: string;
    project_id: string;
    task_category_id: string;
    minutes: number;
    comment?: string;
    project: ProjectBase;
    task_category: TaskCategoryBase;
}

interface AttendanceResponse {
    total_work_minutes?: number;
}

interface CalendarDailyResponse {
    date: string;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    shift_type?: string;
    attendance?: AttendanceResponse;
    work_logs: WorkLogWithDetails[];
    total_log_minutes: number;
}

import { BACKEND_URL } from "@/lib/constants";

export default function MonthlyReportPage() {
    const auth = useAuth();
    const { isAuthenticated } = useAuth() || {};
    const user = auth?.user;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<CalendarDailyResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    useEffect(() => {
        const fetchRecords = async () => {
            if (!isAuthenticated) return;
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    year: year.toString(),
                    month: month.toString(),
                });
                const url = joinUrl(BACKEND_URL, `/api/v1/attendances/my-monthly-records?${query}`);
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setRecords(data);
                }
            } catch (error) {
                console.error("Failed to fetch monthly records", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [isAuthenticated, year, month]);

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month, 1));
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "-";
        return format(new Date(isoString), "HH:mm");
    };

    const formatMinutes = (minutes?: number) => {
        if (minutes === undefined || minutes === null) return "-";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${m.toString().padStart(2, "0")}`;
    };

    const getDayColor = (dateStr: string) => {
        const day = new Date(dateStr).getDay();
        if (day === 0) return "text-red-500"; // Sunday
        if (day === 6) return "text-blue-500"; // Saturday
        return "";
    };

    const isNonWorkingDay = (shiftType?: string) => {
        if (!shiftType) return false;
        const types = ["PaidLeave", "公休", "全休", "有給", "有休"];
        return types.includes(shiftType);
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl w-full min-w-0 overflow-hidden">
            <PageHeader
                title="月報"
                description="月ごとの勤務実績と工数集計を確認・承認申請します。"
                icon={ClipboardList}
            >
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start bg-slate-900/60 backdrop-blur-md p-2 rounded-lg border border-indigo-500/20 text-white">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg md:text-xl font-semibold px-2 min-w-[120px] text-center">
                        {year}年 {month}月
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </PageHeader>

            <Card className="w-full min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-0 min-w-0 max-w-full overflow-hidden">
                    <div className="relative w-full min-w-0 max-w-full overflow-x-auto max-h-[70vh] border rounded-md">

                        <table className="w-full min-w-[700px] caption-bottom text-sm text-left">
                            <thead className="sticky top-0 z-20 bg-background">
                                <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">日付</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">勤怠区分</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">開始</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">終了</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">就業時間</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px] border-b">作業時間</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b">日報明細</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td colSpan={7} className="p-4 align-middle h-24 text-center">
                                            読み込み中...
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td colSpan={7} className="p-4 align-middle h-24 text-center">
                                            データがありません
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr
                                            key={record.date}
                                            onDoubleClick={() => !isNonWorkingDay(record.shift_type) && router.push(`/daily-report?date=${record.date}&from=monthly`)}
                                            className={cn(
                                                "border-b transition-colors data-[state=selected]:bg-muted",
                                                isNonWorkingDay(record.shift_type) ? "bg-gray-100 hover:bg-gray-100" : "hover:bg-slate-50 cursor-pointer"
                                            )}
                                        >
                                            <td className={cn("p-4 align-middle", getDayColor(record.date))}>
                                                {format(new Date(record.date), "MM/dd (eee)", { locale: ja })}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {record.shift_type === "PaidLeave" ? "有休" :
                                                    record.shift_type === "HalfDayMorning" ? "午前休" :
                                                        record.shift_type === "HalfDayAfternoon" ? "午後休" :
                                                            (record.shift_type === "Normal" || record.shift_type === "通常") ? "" :
                                                                record.shift_type || "-"}
                                            </td>
                                            <td className="p-4 align-middle">{formatTime(record.scheduled_start_time)}</td>
                                            <td className="p-4 align-middle">{formatTime(record.scheduled_end_time)}</td>
                                            <td className="p-4 align-middle">{formatMinutes(record.attendance?.total_work_minutes)}</td>
                                            <td className="p-4 align-middle">{formatMinutes(record.total_log_minutes)}</td>
                                            <td className="p-4 align-middle">
                                                {record.work_logs.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {record.work_logs.map((log, i) => (
                                                            <TooltipProvider key={i}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs cursor-default">
                                                                            <span className="font-medium">{log.project.name}</span>
                                                                            <span>({log.minutes}分)</span>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="font-semibold">{log.project.name} / {log.task_category.name}</p>
                                                                        {log.comment && <p className="text-xs mt-1">{log.comment}</p>}
                                                                        <p className="text-xs mt-1">{log.minutes}分</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
