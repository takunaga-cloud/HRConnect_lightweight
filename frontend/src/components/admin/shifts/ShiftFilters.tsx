import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { ShiftTemplate } from "@/types"

interface User {
    id: string
    name: string
    user_id?: string
}

interface ShiftFiltersProps {
    currentDate: Date
    setCurrentDate: (date: Date) => void
    users: User[]
    templates: ShiftTemplate[]
    filterUser: string
    setFilterUser: (val: string) => void
    filterShiftType: string
    setFilterShiftType: (val: string) => void
    filterStatus: string
    setFilterStatus: (val: string) => void
    filteredCount: number
}

export function ShiftFilters({
    currentDate,
    setCurrentDate,
    users,
    templates,
    filterUser,
    setFilterUser,
    filterShiftType,
    setFilterShiftType,
    filterStatus,
    setFilterStatus,
    filteredCount
}: ShiftFiltersProps) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg w-32 text-center">
                        {format(currentDate, "yyyy年 M月")}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="従業員で絞り込み" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全員</SelectItem>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.user_id} {u.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterShiftType} onValueChange={setFilterShiftType}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="シフトで絞り込み" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全タイプ</SelectItem>
                        <SelectItem value="通常">通常</SelectItem>
                        <SelectItem value="公休">公休</SelectItem>
                        {templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="ステータス" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全ステータス</SelectItem>
                        <SelectItem value="Approved">確定済み</SelectItem>
                        <SelectItem value="Requested">希望（未確定）</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <span className="text-sm text-gray-500">{filteredCount} 件のシフト</span>
            </div>
        </div>
    )
}
