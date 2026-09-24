import { format, subMonths, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { User } from "@/types"

interface AttendanceFilterProps {
    currentDate: Date
    setCurrentDate: (date: Date) => void
    selectedUser: string
    setSelectedUser: (userId: string) => void
    users: User[]
}

export function AttendanceFilter({
    currentDate,
    setCurrentDate,
    selectedUser,
    setSelectedUser,
    users
}: AttendanceFilterProps) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-indigo-500/20 text-white w-full min-w-0 max-w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-slate-950/80 border-slate-800 text-white">
                        <SelectValue placeholder="全従業員" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="all">全従業員</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.user_id} {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 min-w-0">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base sm:text-lg font-semibold w-28 text-center text-white shrink-0">
                    {format(currentDate, "yyyy年 M月", { locale: ja })}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
