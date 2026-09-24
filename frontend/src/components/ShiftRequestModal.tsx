import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BACKEND_URL } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"

// 希望シフト申請モーダルのプロパティ定義
interface ShiftRequestModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string // YYYY-MM-DD 形式
    onSubmitSuccess: () => void
}

export default function ShiftRequestModal({ isOpen, onClose, selectedDate, onSubmitSuccess }: ShiftRequestModalProps) {
    const { isAuthenticated } = useAuth() || {}
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("18:00")
    const [shiftType, setShiftType] = useState("通常勤務")
    const [remarks, setRemarks] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ダイアログが開いたときに初期化する
    useEffect(() => {
        if (isOpen) {
            setStartTime("09:00")
            setEndTime("18:00")
            setShiftType("通常勤務")
            setRemarks("")
            setError(null)
        }
    }, [isOpen, selectedDate])

    // シフトタイプ変更時のデフォルト時間自動設定
    const handleShiftTypeChange = (value: string) => {
        setShiftType(value)
        if (value === "通常勤務") {
            setStartTime("09:00")
            setEndTime("18:00")
        } else if (value === "早番") {
            setStartTime("08:00")
            setEndTime("17:00")
        } else if (value === "遅番") {
            setStartTime("13:00")
            setEndTime("22:00")
        } else if (value === "夜勤") {
            setStartTime("22:00")
            setEndTime("07:00")
        } else if (value === "公休" || value === "振替休日") {
            setStartTime("00:00")
            setEndTime("00:00")
        }
    }

    // 申請処理
    const handleSubmit = async () => {
        if (!isAuthenticated) return
        setLoading(true)
        setError(null)

        try {
            // 時間のバリデーションチェック用に秒を追加 (HH:MM:SS)
            const formatTime = (t: string) => {
                if (!t) return "00:00:00"
                return t.length === 5 ? `${t}:00` : t
            }

            const isHoliday = shiftType === "公休" || shiftType === "振替休日"

            const requestBody = {
                requests: [
                    {
                        target_date: selectedDate,
                        start_time: formatTime(startTime),
                        end_time: formatTime(endTime),
                        is_holiday: isHoliday,
                        shift_type: shiftType,
                        remarks: remarks || shiftType
                    }
                ]
            }

            const token = localStorage.getItem("token")
            const res = await fetch(`${BACKEND_URL}/api/v1/shifts/my-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            })

            if (res.ok) {
                onSubmitSuccess()
                onClose()
            } else {
                const data = await res.json()
                setError(data.detail || "希望シフトの申請に失敗しました。")
            }
        } catch (err) {
            console.error(err)
            setError("通信エラーが発生しました。")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>希望シフト登録・申請</DialogTitle>
                    <DialogDescription>
                        {selectedDate} の希望シフトを登録して管理者に申請します。
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shift-type" className="text-right">
                            シフト区分
                        </Label>
                        <div className="col-span-3">
                            <Select value={shiftType} onValueChange={handleShiftTypeChange}>
                                <SelectTrigger id="shift-type">
                                    <SelectValue placeholder="シフト区分を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="通常勤務">通常勤務 (09:00 - 18:00)</SelectItem>
                                    <SelectItem value="早番">早番 (08:00 - 17:00)</SelectItem>
                                    <SelectItem value="遅番">遅番 (13:00 - 22:00)</SelectItem>
                                    <SelectItem value="夜勤">夜勤 (22:00 - 07:00)</SelectItem>
                                    <SelectItem value="公休">公休</SelectItem>
                                    <SelectItem value="振替休日">振替休日</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {shiftType !== "公休" && shiftType !== "振替休日" && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="start-time" className="text-right">
                                    開始時間
                                </Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    className="col-span-3"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="end-time" className="text-right">
                                    終了時間
                                </Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    className="col-span-3"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remarks" className="text-right">
                            備考/希望理由
                        </Label>
                        <Input
                            id="remarks"
                            placeholder="例: 午前中私用あり、通院など"
                            className="col-span-3"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "申請中..." : "申請する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
