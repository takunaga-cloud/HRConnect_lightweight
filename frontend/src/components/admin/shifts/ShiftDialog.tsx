import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shift, User, ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format } from "date-fns"

interface ShiftDialogProps {
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
    users: User[]
    templates: ShiftTemplate[]
    initialData?: Shift
}

type ShiftFormData = Omit<Shift, "id"> & { id?: string }

const DEFAULT_FORM_DATA: ShiftFormData = {
    target_date: "", // Should be set by caller or init
    start_time: "09:00",
    end_time: "18:00",
    shift_type: "日勤",
    is_holiday: false,
    user_id: "",
    remarks: "日勤"
}

export function ShiftDialog({ isOpen, onClose, onUpdate, users, templates, initialData }: ShiftDialogProps) {
    const { isAuthenticated } = useAuth() || {}
    const [formData, setFormData] = useState<ShiftFormData>(DEFAULT_FORM_DATA)

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (initialData) {
                    setFormData({
                        ...initialData,
                        target_date: initialData.target_date ? initialData.target_date.replace(/-/g, "/") : "",
                        start_time: initialData.start_time ? initialData.start_time.substring(0, 5) : "",
                        end_time: initialData.end_time ? initialData.end_time.substring(0, 5) : "",
                        remarks: initialData.remarks || ""
                    })
                } else {
                    setFormData({
                        ...DEFAULT_FORM_DATA,
                        target_date: format(new Date(), "yyyy/MM/dd")
                    })
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialData])

    const handleTemplateChange = (type: string) => {
        const template = templates.find(t => t.name === type);
        if (template) {
            setFormData({
                ...formData,
                shift_type: type,
                start_time: template.start_time.substring(0, 5),
                end_time: template.end_time.substring(0, 5),
                is_holiday: type === "振替休日" || type === "公休",
                remarks: type
            })
        } else {
            let start = formData.start_time;
            let end = formData.end_time;
            let isHoliday = formData.is_holiday;
            
            if (type === "夜勤") {
                start = "22:00";
                end = "07:00";
                isHoliday = false;
            } else if (type === "休日出勤") {
                start = "09:00";
                end = "18:00";
                isHoliday = false;
            } else if (type === "振替休日") {
                start = "";
                end = "";
                isHoliday = true;
            }
            
            setFormData({
                ...formData,
                shift_type: type,
                start_time: start,
                end_time: end,
                is_holiday: isHoliday,
                remarks: type
            })
        }
    }

    const handleSaveShift = async () => {
        if (!isAuthenticated) return

        const start = formData.start_time ? (formData.start_time.length === 5 ? formData.start_time + ":00" : formData.start_time) : null
        const end = formData.end_time ? (formData.end_time.length === 5 ? formData.end_time + ":00" : formData.end_time) : null

        if (formData.id) {
            // UPDATE
            const payload = {
                target_date: formData.target_date.replace(/\//g, "-"),
                start_time: start,
                end_time: end,
                shift_type: formData.shift_type,
                user_id: formData.user_id,
                is_holiday: formData.is_holiday || false,
                remarks: formData.remarks
            }
            try {
                const res = await fetch(BACKEND_URL + "/api/v1/shifts/" + formData.id, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    onClose()
                    onUpdate()
                    alert("シフトを更新しました")
                } else {
                    console.error(await res.text())
                    alert("更新に失敗しました")
                }
            } catch (e) { console.error(e) }
        } else {
            // CREATE (Bulk or Single)
            let shiftsToCreate = []
            if (formData.user_id === "ALL") {
                shiftsToCreate = users.map(u => ({
                    target_date: formData.target_date.replace(/\//g, "-"),
                    start_time: start,
                    end_time: end,
                    shift_type: formData.shift_type,
                    user_id: u.id,
                    is_holiday: formData.is_holiday || false,
                    remarks: formData.remarks
                }))
            } else {
                shiftsToCreate = [{
                    target_date: formData.target_date.replace(/\//g, "-"),
                    start_time: start,
                    end_time: end,
                    shift_type: formData.shift_type,
                    user_id: formData.user_id,
                    is_holiday: formData.is_holiday || false,
                    remarks: formData.remarks
                }]
            }

            try {
                const res = await fetch(BACKEND_URL + "/api/v1/shifts/bulk", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ shifts: shiftsToCreate })
                })
                if (res.ok) {
                    onClose()
                    onUpdate()
                    alert("シフトを保存しました")
                } else {
                    console.error(await res.text())
                    alert("保存に失敗しました")
                }
            } catch (e) { console.error(e) }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>シフト登録</DialogTitle>
                    <DialogDescription>従業員のシフトを追加・編集します。</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="user-select" className="text-right">従業員</Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.user_id}
                                onValueChange={(val) => setFormData({ ...formData, user_id: val })}
                            >
                                <SelectTrigger id="user-select">
                                    <SelectValue placeholder="従業員を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">全従業員</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.user_id} {u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date-input" className="text-right">日付</Label>
                        <DateInput
                            id="date-input"
                            className="col-span-3"
                            value={formData.target_date}
                            onChange={(val) => setFormData({ ...formData, target_date: val })}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type-select" className="text-right">タイプ</Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.shift_type}
                                onValueChange={handleTemplateChange}
                            >
                                <SelectTrigger id="type-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                    ))}
                                    {!templates.find(t => t.name === "通常") && <SelectItem value="通常">通常</SelectItem>}
                                    <SelectItem value="休日出勤">休日出勤</SelectItem>
                                    <SelectItem value="夜勤">夜勤</SelectItem>
                                    <SelectItem value="振替休日">振替休日</SelectItem>
                                    <SelectItem value="Custom">カスタム</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">時間</Label>
                        <div className="col-span-3 flex gap-2 items-center">
                            <Input
                                aria-label="開始時間"
                                type="text"
                                placeholder="09:00"
                                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                title="24時間形式 (例: 09:00)"
                                value={formData.start_time || ""}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length === 4 && !val.includes(":")) {
                                        val = val.substring(0, 2) + ":" + val.substring(2, 4);
                                    }
                                    setFormData({ ...formData, start_time: val });
                                }}
                            />
                            <span>~</span>
                            <Input
                                aria-label="終了時間"
                                type="text"
                                placeholder="18:00"
                                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                title="24時間形式 (例: 18:00)"
                                value={formData.end_time || ""}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length === 4 && !val.includes(":")) {
                                        val = val.substring(0, 2) + ":" + val.substring(2, 4);
                                    }
                                    setFormData({ ...formData, end_time: val });
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remarks-input" className="text-right">備考</Label>
                        <Input
                            id="remarks-input"
                            className="col-span-3"
                            value={formData.remarks || ""}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex items-center space-x-2 mr-auto">
                        <input
                            type="checkbox"
                            id="is_holiday"
                            checked={formData.is_holiday || false}
                            onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked, shift_type: e.target.checked ? "公休" : formData.shift_type, remarks: e.target.checked ? "公休" : formData.remarks })}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is_holiday">休日にする</Label>
                    </div>
                    <Button onClick={handleSaveShift}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
