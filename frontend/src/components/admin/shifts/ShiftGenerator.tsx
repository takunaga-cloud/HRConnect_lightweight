import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format, addMonths } from "date-fns"

interface ShiftGeneratorProps {
    users: User[]
    templates: ShiftTemplate[]
    onUpdate: () => void
}

export function ShiftGenerator({ users, templates, onUpdate }: ShiftGeneratorProps) {
    const { isAuthenticated } = useAuth() || {}
    const [isOpen, setIsOpen] = useState(false)

    const [form, setForm] = useState({
        user_ids: [] as string[],
        start_date: format(new Date(), "yyyy/MM/dd"),
        end_date: format(addMonths(new Date(), 1), "yyyy/MM/dd"),
        start_time: "09:00",
        end_time: "18:00",
        shift_type: "通常",
        weekdays: [0, 1, 2, 3, 4], // Mon-Fri
        exclude_public_holidays: true,
        remarks: "通常"
    })

    // Template change handler
    const handleTemplateChange = (val: string) => {
        const t = templates.find(t => t.name === val)
        if (t) {
            setForm({
                ...form,
                shift_type: t.name,
                start_time: t.start_time.substring(0, 5),
                end_time: t.end_time.substring(0, 5),
                remarks: t.name
            })
        } else {
            setForm({ ...form, shift_type: val, remarks: val })
        }
    }

    const handleGenerate = async () => {
        if (!isAuthenticated) return;
        if (form.user_ids.length === 0) {
            alert("対象の従業員を選択してください");
            return;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/generate-work-shifts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    start_date: form.start_date.replace(/\//g, "-"),
                    end_date: form.end_date.replace(/\//g, "-"),
                    start_time: form.start_time + ":00",
                    end_time: form.end_time + ":00"
                })
            });

            if (res.ok) {
                alert("通常シフトを一括生成しました");
                setIsOpen(false);
                onUpdate();
            } else {
                const errorText = await res.text();
                console.error("Generation failed:", errorText);
                alert("生成に失敗しました: " + errorText);
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-950/80 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white text-xs md:text-sm px-3 py-1">通常シフト一括生成</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>通常シフト一括生成</DialogTitle>
                    <DialogDescription>
                        指定した期間・曜日・時間で通常シフトを一括生成します。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">対象</Label>
                        <Select
                            value={form.user_ids.length === users.length ? "ALL" : form.user_ids[0] || ""}
                            onValueChange={(val) => {
                                if (val === "ALL") {
                                    setForm({ ...form, user_ids: users.map(u => u.id) });
                                } else {
                                    setForm({ ...form, user_ids: [val] });
                                }
                            }}
                        >
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
                            <DateInput value={form.start_date} onChange={(val) => setForm({ ...form, start_date: val })} />
                            <span>~</span>
                            <DateInput value={form.end_date} onChange={(val) => setForm({ ...form, end_date: val })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">時間</Label>
                        <div className="col-span-3 flex gap-2 items-center">
                            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                            <span>~</span>
                            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">タイプ</Label>
                        <Select
                            value={form.shift_type}
                            onValueChange={handleTemplateChange}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                ))}
                                {!templates.find(t => t.name === "通常") && <SelectItem value="通常">通常</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">備考</Label>
                        <Input
                            className="col-span-3"
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">曜日</Label>
                        <div className="col-span-3 grid grid-cols-4 gap-2">
                            {["月", "火", "水", "木", "金", "土", "日"].map((label, idx) => {
                                const dayVal = idx === 6 ? 6 : idx;
                                return (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`day-${idx}`}
                                            checked={form.weekdays.includes(dayVal)}
                                            onChange={(e) => {
                                                const newWeekdays = e.target.checked
                                                    ? [...form.weekdays, dayVal]
                                                    : form.weekdays.filter(d => d !== dayVal);
                                                setForm({ ...form, weekdays: newWeekdays });
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor={`day-${idx}`}>{label}</Label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">オプション</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="exclude_pub"
                                checked={form.exclude_public_holidays}
                                onChange={(e) => setForm({ ...form, exclude_public_holidays: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="exclude_pub">祝日を除外する</Label>
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
