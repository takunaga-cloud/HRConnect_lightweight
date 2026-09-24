import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format, startOfMonth, endOfMonth } from "date-fns"

interface HolidayGeneratorProps {
    users: User[]
    onUpdate: () => void
}

export function HolidayGenerator({ users, onUpdate }: HolidayGeneratorProps) {
    const { isAuthenticated } = useAuth() || {}
    const [isOpen, setIsOpen] = useState(false)
    const [start, setStart] = useState(format(startOfMonth(new Date()), "yyyy/MM/dd"))
    const [end, setEnd] = useState(format(endOfMonth(new Date()), "yyyy/MM/dd"))
    const [target, setTarget] = useState("ALL")
    const [includeSaturdays, setIncludeSaturdays] = useState(true)
    const [includeSundays, setIncludeSundays] = useState(true)
    const [includePublicHolidays, setIncludePublicHolidays] = useState(true)

    const handleGenerate = async () => {
        if (!isAuthenticated) return;
        if (!confirm("指定した条件で休日シフトを生成しますか？\n既存のシフトがある場合は上書きされます。")) return;

        const targetUserIds = target === "ALL" ? users.map(u => u.id) : [target]

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/generate-holidays", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_ids: targetUserIds,
                    start_date: start.replace(/\//g, "-"),
                    end_date: end.replace(/\//g, "-"),
                    include_saturdays: includeSaturdays,
                    include_sundays: includeSundays,
                    include_public_holidays: includePublicHolidays
                })
            })
            if (res.ok) {
                alert("休日シフトを生成しました")
                setIsOpen(false)
                onUpdate()
            } else {
                console.error(await res.text())
                alert("生成に失敗しました")
            }
        } catch (e) { console.error(e) }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-950/80 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white text-xs md:text-sm px-3 py-1">休日一括登録</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>休日一括登録</DialogTitle>
                    <DialogDescription>
                        指定した期間・条件で休日シフトを一括生成します。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">対象</Label>
                        <Select value={target} onValueChange={setTarget}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="対象を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全従業員</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.user_id} {u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">期間</Label>
                        <div className="col-span-3 flex gap-2 items-center">
                            <DateInput value={start} onChange={setStart} />
                            <span>~</span>
                            <DateInput value={end} onChange={setEnd} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">条件</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="inc_sat" checked={includeSaturdays} onChange={(e) => setIncludeSaturdays(e.target.checked)} className="h-4 w-4" />
                                <Label htmlFor="inc_sat">土曜日を含める</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="inc_sun" checked={includeSundays} onChange={(e) => setIncludeSundays(e.target.checked)} className="h-4 w-4" />
                                <Label htmlFor="inc_sun">日曜日を含める</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="inc_pub" checked={includePublicHolidays} onChange={(e) => setIncludePublicHolidays(e.target.checked)} className="h-4 w-4" />
                                <Label htmlFor="inc_pub">祝日を含める</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate}>生成実行</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
