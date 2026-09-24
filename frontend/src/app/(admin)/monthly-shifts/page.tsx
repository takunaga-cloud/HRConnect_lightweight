"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSaturday, isSunday } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, CalendarRange } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"

interface User {
    id: string
    name: string
    department?: {
        name: string
    }
}

interface Shift {
    id: string
    user_id: string
    target_date: string
    shift_type: string
    start_time: string
    end_time: string
    is_holiday: boolean
    remarks?: string
    status?: string
}

export default function AdminMonthlyShiftsPage() {
    const { isAuthenticated, user } = useAuth() || {}
    const [currentDate, setCurrentDate] = useState(new Date())
    const [users, setUsers] = useState<User[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
    const [selectedEmployee, setSelectedEmployee] = useState<string>("all")


    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const fetchData = async () => {
        if (!isAuthenticated) return
        setLoading(true)
        try {
            const usersRes = await fetch(`${BACKEND_URL}/api/v1/users/`)

            const startStr = format(startDate, "yyyy-MM-dd")
            const endStr = format(endDate, "yyyy-MM-dd")
            const shiftsRes = await fetch(`${BACKEND_URL}/api/v1/shifts/?start_date=${startStr}&end_date=${endStr}`)

            const applicationsRes = await fetch(`${BACKEND_URL}/api/v1/applications/?status=Approved`, {
                cache: 'no-store'
            })

            if (usersRes.ok && shiftsRes.ok && applicationsRes.ok) {
                setUsers(await usersRes.json())
                setShifts(await shiftsRes.json())
                setApplications(await applicationsRes.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [isAuthenticated, currentDate])

    useEffect(() => {
        if (user && user.role && !["Admin", "Manager"].includes(user.role)) {
            const u = user as any;
            if (u.department?.name) {
                setSelectedDepartment(u.department.name as string)
            }
        }
    }, [user])

    const getShift = (userId: string, date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return shifts.find(s => s.user_id === userId && s.target_date === dateStr)
    }

    const getPaidLeaveApp = (user: User, date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return applications.find(app => {
            if (!["PaidLeave", "有給休暇申請"].includes(app.type) || app.user_id !== user.id) return false
            const input = app.input_data
            if (!input || !input.leave_start_date || !input.leave_end_date) return false
            return dateStr >= input.leave_start_date && dateStr <= input.leave_end_date
        })
    }

    const formatShiftCell = (user: User, date: Date, shift?: Shift) => {
        const paidLeaveApp = getPaidLeaveApp(user, date)

        if (paidLeaveApp) {
            const leaveType = paidLeaveApp.input_data.leave_type
            if (leaveType === "FullDay" || leaveType === "全日" || leaveType === "全日休暇") return <span className="text-orange-600 font-bold">全休</span>

            if (leaveType === "HalfDayMorning" || leaveType === "午前半休" || (leaveType && leaveType.includes("午前"))) {
                return <span className="text-orange-600 font-bold">AM休</span>
            }
            if (leaveType === "HalfDayAfternoon" || leaveType === "午後半休" || (leaveType && leaveType.includes("午後"))) {
                return <span className="text-orange-600 font-bold">PM休</span>
            }
        }

        if (!shift) return ""

        if (["PaidLeave", "FullDay", "全日休暇"].includes(shift.shift_type)) {
            return <span className="text-orange-600 font-bold">全休</span>
        }
        if (["HalfDayMorning", "午前半休", "AM休"].includes(shift.shift_type)) {
            return <span className="text-orange-600 font-bold">AM休</span>
        }
        if (["HalfDayAfternoon", "午後半休", "PM休"].includes(shift.shift_type)) {
            return <span className="text-orange-600 font-bold">PM休</span>
        }

        if (shift.shift_type === "公休") return ""

        if (shift.is_holiday) return <span className="text-red-500 font-bold">休</span>

        if (shift.shift_type && shift.shift_type.length <= 4) return shift.shift_type

        // 開始時間〜終了時間を「00:00」の形式で分まで表示する
        const start = shift.start_time ? shift.start_time.substring(0, 5) : "";
        const end = shift.end_time ? shift.end_time.substring(0, 5) : "";
        if (start && end) {
            return <span className="text-[8px] sm:text-xs font-semibold">{start}〜{end}</span>;
        }

        return start;
    }

    const getCellClass = (user: User, date: Date, shift?: Shift) => {
        let classes = "border-b border-r border-gray-200 p-1 text-center text-xs h-10 min-w-[3rem] whitespace-nowrap overflow-hidden text-ellipsis relative "

        const paidLeaveApp = getPaidLeaveApp(user, date)
        const isFullDayLeave = (paidLeaveApp && ["FullDay", "全日", "全日休暇"].includes(paidLeaveApp.input_data.leave_type)) ||
            (shift && ["PaidLeave", "FullDay", "全日休暇"].includes(shift.shift_type))

        if (shift?.is_holiday || isFullDayLeave) classes += "bg-red-50 "
        else if (isSaturday(date)) classes += "bg-blue-50/30 "
        else if (isSunday(date)) classes += "bg-red-50/30 "
        return classes
    }

    const getHeaderClass = (date: Date) => {
        let classes = "p-2 font-medium border-b border-t border-r border-gray-200 text-center text-xs min-w-[3rem] "
        if (isSaturday(date)) classes += "text-blue-600 bg-blue-50 "
        else if (isSunday(date)) classes += "text-red-600 bg-red-50 "
        return classes
    }

    const uniqueDepartments = Array.from(new Set(users.map(u => u.department?.name).filter(Boolean))) as string[]
    const filteredUsers = users.filter(user => {
        const matchDepartment = selectedDepartment === "all" || user.department?.name === selectedDepartment
        const matchEmployee = selectedEmployee === "all" || user.id === selectedEmployee
        return matchDepartment && matchEmployee
    })

    // スマホでのアコーディオン展開用のステート
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const toggleUserExpand = (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
        }
    };

    return (
        <TooltipProvider>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl w-full min-w-0 max-w-full overflow-hidden">
                <PageHeader
                    title="月間シフト一覧"
                    description="組織全体の月間シフト稼働予定を一覧表で確認します。"
                    icon={CalendarRange}
                >
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-indigo-500/20 text-white w-full min-w-0 max-w-full">
                        <div className="flex flex-col sm:flex-row flex-1 gap-2 min-w-0">
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/80 border-slate-800 text-white">
                                    <SelectValue placeholder="部門を選択" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                    <SelectItem value="all">全部門</SelectItem>
                                    {uniqueDepartments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/80 border-slate-800 text-white">
                                    <SelectValue placeholder="従業員を選択" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                    <SelectItem value="all">全従業員</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between xl:justify-end gap-3 border-t xl:border-t-0 pt-2 xl:pt-0 min-w-0">
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold w-28 text-center text-white shrink-0">
                                {format(currentDate, "yyyy年 M月", { locale: ja })}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </PageHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground text-sm">データを読み込み中...</span>
                    </div>
                ) : (
                    <Card className="shadow-md w-full min-w-0 max-w-full overflow-hidden">
                        <CardContent className="p-0 min-w-0 max-w-full overflow-hidden">
                            <style jsx global>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 12px;
                                height: 12px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: #f1f1f1;
                                border-radius: 4px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #c1c1c1;
                                border-radius: 6px;
                                border: 2px solid #f1f1f1;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #a8a8a8;
                            }
                            .custom-scrollbar::-webkit-scrollbar-corner {
                                background: #f1f1f1;
                            }
                        `}</style>
                            <div className="overflow-scroll max-h-[calc(100vh-300px)] relative w-full custom-scrollbar">
                                <table className="w-auto min-w-max border-separate border-spacing-0 border-l border-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="sticky top-0 left-0 z-30 bg-background border-b border-t border-r border-gray-200 p-1 min-w-[120px] text-xs text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">従業員名</th>
                                            <th className="sticky top-0 left-[120px] z-30 bg-background border-b border-t border-r border-gray-200 p-1 min-w-[100px] text-xs text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">部門</th>
                                            {days.map(d => (
                                                <th key={d.toString()} className={`${getHeaderClass(d)} sticky top-0 z-20 bg-background shadow-[0_2px_5px_-2px_rgba(0,0,0,0.1)]`}>
                                                    {format(d, "d")}
                                                    <div className="text-[10px]">{format(d, "E", { locale: ja })}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-muted/50">
                                                <td className="sticky left-0 z-10 bg-background border-b border-r border-gray-200 p-1 text-xs truncate max-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={user.name}>
                                                    {user.name}
                                                </td>
                                                <td className="sticky left-[120px] z-10 bg-background border-b border-r border-gray-200 p-1 text-xs truncate max-w-[100px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={user.department?.name}>
                                                    {user.department?.name || "-"}
                                                </td>
                                                {days.map(d => {
                                                    const shift = getShift(user.id, d)
                                                    const isPaidLeave = shift && ["PaidLeave", "FullDay", "全日休暇"].includes(shift.shift_type)
        
                                                    const paidLeaveApp = getPaidLeaveApp(user, d);
                                                    const isFullDayApp = paidLeaveApp && ["FullDay", "全日", "全日休暇"].includes(paidLeaveApp.input_data.leave_type);
        
                                                    const isFullDay = isPaidLeave || isFullDayApp;
        
                                                    let effectiveRemarks = shift?.remarks
                                                    if (shift && ["HalfDayMorning", "午前半休", "AM休", "HalfDayAfternoon", "午後半休", "PM休"].includes(shift.shift_type)) {
                                                        const dateStr = format(d, "yyyy-MM-dd");
                                                        const dailyShifts = shifts.filter(s => s.user_id === user.id && s.target_date === dateStr);
                                                        const otherShiftWithRemark = dailyShifts.find(s => s.id !== shift.id && s.remarks);
                                                        if (otherShiftWithRemark) {
                                                            effectiveRemarks = otherShiftWithRemark.remarks
                                                        }
                                                    }
        
                                                    const showRemarks = effectiveRemarks && effectiveRemarks !== shift?.shift_type && !isFullDay
                                                    return (
                                                        <td key={d.toString()} className={getCellClass(user, d, shift)}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        {formatShiftCell(user, d, shift)}
                                                                        {showRemarks && (
                                                                            <span className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-r-[6px] border-l-transparent border-b-transparent border-t-red-500 border-r-red-500" />
                                                                        )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                {showRemarks && (
                                                                    <TooltipContent key={d.toString() + "content"}>
                                                                        <p>{effectiveRemarks}</p>
                                                                    </TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="text-xs sm:text-sm text-gray-500 space-y-1 mt-4">
                    <p>※ 従業員ごとのシフト状況を一覧表示しています。</p>
                    <p>※ 編集は「シフト管理」画面から行ってください。</p>
                </div>
            </div>
        </TooltipProvider>
    )
}
