import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Attendance } from "@/types"

interface AttendanceTableProps {
    attendances: Attendance[]
    loading: boolean
    getUserName: (userId: string) => string
    onDelete: (id: string) => void
}

export function AttendanceTable({ attendances, loading, getUserName, onDelete }: AttendanceTableProps) {
    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return "-"
        try {
            const date = new Date(timeStr)
            return format(date, "HH:mm")
        } catch {
            return timeStr
        }
    }

    const formatDuration = (minutes: number | null) => {
        if (minutes === null) return "-"
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}時間${m}分`
    }

    return (
        <div className="relative w-full overflow-auto max-h-[75vh] border rounded-md">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="sticky top-0 z-20 bg-background">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[120px]">日付</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">従業員名</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">出勤</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">退勤</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">実働時間</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {loading ? (
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td colSpan={6} className="p-4 align-middle h-24 text-center">
                                読み込み中...
                            </td>
                        </tr>
                    ) : attendances.length === 0 ? (
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td colSpan={6} className="p-4 align-middle h-24 text-center text-muted-foreground">
                                データがありません。
                            </td>
                        </tr>
                    ) : (
                        attendances.map((attendance) => (
                            <tr key={attendance.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">{attendance.work_date}</td>
                                <td className="p-4 align-middle font-medium">{getUserName(attendance.user_id)}</td>
                                <td className="p-4 align-middle">{formatTime(attendance.clock_in)}</td>
                                <td className="p-4 align-middle">{formatTime(attendance.clock_out)}</td>
                                <td className="p-4 align-middle">{formatDuration(attendance.total_work_minutes)}</td>
                                <td className="p-4 align-middle text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="削除">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>打刻を取り消しますか？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    この操作は取り消せません。対象の出退勤記録は永久に削除されます。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={() => onDelete(attendance.id)}
                                                >
                                                    削除
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
