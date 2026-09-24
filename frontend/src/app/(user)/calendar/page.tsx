"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { BACKEND_URL } from "@/lib/constants"
import StampCorrectionModal from "@/components/StampCorrectionModal"
import ShiftRequestModal from "@/components/ShiftRequestModal"

interface Attendance {
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    meta_data?: {
        stamp_type?: string;
    } | null;
}

interface DailyRecord {
    date: string;
    scheduled_start_time: string | null;
    scheduled_end_time: string | null;
    attendance: Attendance | null;
    shift_type: string | null;
    shift_status: string | null;
    shift_id: string | null;
}

export default function AttendanceCalendarPage() {
    const auth = useAuth()
    const { isAuthenticated, loading: authLoading } = useAuth() || {}
    const router = useRouter()
    const [date, setDate] = useState(new Date())
    const [records, setRecords] = useState<DailyRecord[]>([])
    const [loading, setLoading] = useState(true)

    // 打刻修正ダイアログ用ステート
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDateStr, setSelectedDateStr] = useState("")
    const [initialClockIn, setInitialClockIn] = useState<string | null>(null)
    const [initialClockOut, setInitialClockOut] = useState<string | null>(null)

    // 希望シフト申請ダイアログ用ステート
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    
    // 希望シフトのキャンセル（削除）処理
    const handleCancelShiftRequest = async (shiftId: string) => {
        if (!isAuthenticated) return;
        if (!confirm("希望シフトの申請をキャンセルしますか？")) return;
        
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/api/v1/shifts/my-requests/${shiftId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                alert("希望シフトの申請をキャンセルしました。");
                fetchRecords();
            } else {
                alert("キャンセルの処理に失敗しました。");
            }
        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました。");
        }
    };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const res = await fetch(`${BACKEND_URL}/api/v1/attendances/my-monthly-records?year=${year}&month=${month}`, {
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        fetchRecords();
    }, [date, isAuthenticated, authLoading, BACKEND_URL, router]);

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => {
        setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    }

    const nextMonth = () => {
        setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    }

    const getRecordForDay = (day: number) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return records.find(r => r.date === dateStr);
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return "--:--";
        return new Date(timeStr).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // 初期選択日として当日をセット
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

    const handleDayClick = (day: number, record?: DailyRecord) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDay(day);
        setSelectedDateStr(dateStr);
        setInitialClockIn(record?.attendance?.clock_in || null);
        setInitialClockOut(record?.attendance?.clock_out || null);

        // スマートフォンモード時に詳細パネルへスムーズスクロール
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setTimeout(() => {
                const element = document.getElementById("detail-panel");
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100);
        }
    };

    // 選択されている日のレコードを取得
    const selectedRecord = getRecordForDay(selectedDay);

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="勤怠カレンダー"
                description="個人ごとの日別打刻時間と勤務ステータス、休日情報をカレンダー形式で一覧します。"
                icon={Calendar}
            >
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start bg-slate-900/60 backdrop-blur-md p-2 rounded-lg border border-indigo-500/20 text-white">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg md:text-xl font-semibold px-2 min-w-[120px] text-center">
                        {date.getFullYear()}年 {date.getMonth() + 1}月
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* カレンダー本体 */}
                <div className="lg:col-span-2">
                    <Card className="shadow-md">
                        <CardContent className="p-3 sm:p-6">
                            <div className="grid grid-cols-7 mb-2 sm:mb-4 text-center font-bold text-xs sm:text-sm text-muted-foreground">
                                <div className="text-red-500">日</div>
                                <div>月</div>
                                <div>火</div>
                                <div>水</div>
                                <div>木</div>
                                <div>金</div>
                                <div className="text-blue-500">土</div>
                            </div>
                            <div className="grid grid-cols-7 border-l border-t border-muted">
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-16 md:h-24 border-b border-r border-muted bg-muted/10" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const record = getRecordForDay(day);
                                    const isToday = new Date().getDate() === day && new Date().getMonth() === date.getMonth() && new Date().getFullYear() === date.getFullYear();
                                    const isSelected = selectedDay === day;

                                    // 前日以前で、かつ休暇・公休ではないのに打刻実績（出勤）がない場合の背景色警告
                                    const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isPast = cellDate < today;
                                    const isWorkingDay = record && record.shift_type !== 'PaidLeave' && record.shift_type !== '公休';
                                    const isMissingAttendance = isWorkingDay && (!record.attendance || !record.attendance.clock_in);
                                    
                                    let warningBgClass = "";
                                    if (isPast && isMissingAttendance) {
                                        warningBgClass = "bg-red-100/70 dark:bg-red-950/30 text-red-900 dark:text-red-300 border-red-300 dark:border-red-800";
                                    }

                                    let requestedBgClass = "";
                                    if (record?.shift_status === 'Requested') {
                                        requestedBgClass = "border-dashed border-2 border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20";
                                    }

                                    return (
                                        <div
                                            key={day}
                                            className={`h-16 md:h-24 border-b border-r border-muted p-1 sm:p-3 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-colors relative
                                                ${isToday ? 'bg-primary/5 font-bold' : ''} 
                                                ${isSelected ? 'ring-2 ring-primary ring-inset bg-primary/10' : ''}
                                                ${warningBgClass} ${requestedBgClass}`}
                                            onClick={() => handleDayClick(day, record)}
                                        >
                                            <div className="flex flex-row items-center justify-between w-full flex-wrap gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs sm:text-lg ${isToday ? 'text-primary' : ''}`}>{day}</span>
                                                </div>
                                                
                                                {/* PC表示用のバッジ */}
                                                <div className="hidden md:block">
                                                    {record?.shift_status === 'Requested' && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">希望</span>
                                                    )}
                                                    {record?.shift_type === 'PaidLeave' && (
                                                        <span className="inline-flex items-center rounded-full bg-pink-100 dark:bg-pink-900 px-2 py-0.5 text-xs font-semibold text-pink-800 dark:text-pink-300">全休</span>
                                                    )}
                                                    {record?.shift_type === 'HalfDayMorning' && (
                                                        <span className="inline-flex items-center rounded-full bg-pink-100 dark:bg-pink-900 px-2 py-0.5 text-xs font-semibold text-pink-800 dark:text-pink-300">AM休</span>
                                                    )}
                                                    {record?.shift_type === 'HalfDayAfternoon' && (
                                                        <span className="inline-flex items-center rounded-full bg-pink-100 dark:bg-pink-900 px-2 py-0.5 text-xs font-semibold text-pink-800 dark:text-pink-300">PM休</span>
                                                    )}
                                                    {record?.shift_type === '公休' && record?.shift_status !== 'Requested' && (
                                                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900 px-2 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">公休</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* モバイル表示用の極小文字による出退勤・予定時間表示 */}
                                            <div className="md:hidden text-[8px] leading-tight text-center mt-1 flex flex-col justify-end flex-grow">
                                                {record ? (
                                                    <>
                                                        {record.attendance?.clock_in ? (
                                                            <div className="flex flex-col items-center">
                                                                 <div className="text-green-600 dark:text-green-400 font-medium">出{formatTime(record.attendance.clock_in)}</div>
                                                                 <div className="text-orange-600 dark:text-orange-400 font-medium">退{formatTime(record.attendance.clock_out)}</div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-muted-foreground">
                                                                {record.shift_status === 'Requested' && <span className="text-amber-600 dark:text-amber-400 font-bold">希望</span>}
                                                                {record.shift_type === 'PaidLeave' && <span className="text-pink-600 dark:text-pink-400 font-bold">全休</span>}
                                                                {record.shift_type === 'HalfDayMorning' && <span className="text-pink-600 dark:text-pink-400 font-bold">AM休</span>}
                                                                {record.shift_type === 'HalfDayAfternoon' && <span className="text-pink-600 dark:text-pink-400 font-bold">PM休</span>}
                                                                {record.shift_type === '公休' && record.shift_status !== 'Requested' && <span className="text-red-500 font-bold">公休</span>}
                                                                {!record.shift_type && <span>-</span>}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>

                                            {/* PC表示用の詳細テキスト */}
                                            <div className="hidden md:block space-y-1 text-sm">
                                                {record ? (
                                                    <>
                                                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                                                            {(record.shift_type === 'PaidLeave' || (record.shift_type === '公休' && record.shift_status !== 'Requested')) ? (
                                                                <div className="h-4"></div>
                                                            ) : (
                                                                <div>{formatTime(record.scheduled_start_time)} - {formatTime(record.scheduled_end_time)}</div>
                                                            )}
                                                        </div>
                                                        {record.attendance ? (
                                                            <>
                                                                <div className="flex items-center text-green-600 dark:text-green-400 text-xs leading-tight">
                                                                    <span className="font-semibold mr-0.5">出</span>
                                                                    {formatTime(record.attendance.clock_in)}
                                                                </div>
                                                                <div className="flex items-center text-orange-600 dark:text-orange-400 text-xs leading-tight">
                                                                    <span className="font-semibold mr-0.5">退</span>
                                                                    {formatTime(record.attendance.clock_out)}
                                                                </div>
                                                                {record.attendance.meta_data?.stamp_type === 'correction' && (
                                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded mt-1 inline-block font-medium">打刻修正</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-muted-foreground text-xs text-center py-2">-</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-muted-foreground text-xs text-center py-2">-</div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 選択日の詳細パネル (モバイル最適化の主役) */}
                <div className="lg:col-span-1" id="detail-panel">
                    <Card className="shadow-md border-t-4 border-t-primary sticky top-6">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <span>{date.getMonth() + 1}月{selectedDay}日の詳細</span>
                                {selectedDay === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() && (
                                    <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full">本日</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* シフト・予定情報 */}
                            <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                                <div className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
                                    <span>シフト予定</span>
                                    {selectedRecord?.shift_status === 'Requested' && (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">希望申請中</span>
                                    )}
                                </div>
                                <div className="text-sm font-medium flex items-center justify-between">
                                    <span>
                                        {selectedRecord?.shift_type === 'PaidLeave' ? '全日休暇' :
                                         selectedRecord?.shift_type === 'HalfDayMorning' ? '午前休暇' :
                                         selectedRecord?.shift_type === 'HalfDayAfternoon' ? '午後休暇' :
                                         selectedRecord?.shift_type === '公休' ? '公休' :
                                         selectedRecord?.shift_type || 'シフトなし'}
                                    </span>
                                    {selectedRecord && !['PaidLeave', '公休'].includes(selectedRecord.shift_type || '') && selectedRecord.scheduled_start_time && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(selectedRecord.scheduled_start_time)} 〜 {formatTime(selectedRecord.scheduled_end_time)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 打刻実績情報 */}
                            <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                                <div className="text-xs text-muted-foreground font-semibold">打刻実績</div>
                                {selectedRecord?.attendance ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-green-500" /> 出勤
                                            </span>
                                            <span className="font-bold">{formatTime(selectedRecord.attendance.clock_in)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-orange-500" /> 退勤
                                            </span>
                                            <span className="font-bold">{formatTime(selectedRecord.attendance.clock_out)}</span>
                                        </div>

                                        <div className="pt-2 border-t flex gap-2">
                                            {selectedRecord.attendance.meta_data?.stamp_type === 'gps' && (
                                                <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-muted-foreground px-2 py-0.5 rounded font-medium">GPS打刻</span>
                                            )}
                                            {selectedRecord.attendance.meta_data?.stamp_type === 'correction' && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-medium">打刻修正</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">打刻データがありません</div>
                                )}
                            </div>

                            {/* 申請アクションボタン (スマホで非常に押しやすい) */}
                            <div className="space-y-2">
                                <Button 
                                    className="w-full py-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm rounded-lg"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <Clock className="h-4 w-4" />
                                    打刻修正を申請する
                                </Button>

                                <Button 
                                    className="w-full py-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm rounded-lg"
                                    variant="outline"
                                    onClick={() => setIsRequestModalOpen(true)}
                                >
                                    希望シフトを申請する
                                </Button>

                                {selectedRecord?.shift_status === 'Requested' && selectedRecord.shift_id && (
                                    <Button 
                                        className="w-full py-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/20"
                                        variant="outline"
                                        onClick={() => handleCancelShiftRequest(selectedRecord.shift_id!)}
                                    >
                                        希望申請をキャンセルする
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <StampCorrectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDateStr}
                initialClockIn={initialClockIn}
                initialClockOut={initialClockOut}
                onSubmitSuccess={fetchRecords}
            />

            <ShiftRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                selectedDate={selectedDateStr}
                onSubmitSuccess={fetchRecords}
            />
        </div>
    )
}
