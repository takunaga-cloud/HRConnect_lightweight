"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"

interface StampCorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    initialClockIn: string | null; // ISO format or null
    initialClockOut: string | null; // ISO format or null
    onSubmitSuccess?: () => void;
}

export default function StampCorrectionModal({
    isOpen,
    onClose,
    selectedDate,
    initialClockIn,
    initialClockOut,
    onSubmitSuccess
}: StampCorrectionModalProps) {
    const { isAuthenticated } = useAuth() || {}
    const [newClockIn, setNewClockIn] = useState("")
    const [newClockOut, setNewClockOut] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shiftData, setShiftData] = useState<any>(null)

    // Helper to format ISO time to HH:MM
    const formatToTimeInput = (isoStr: string | null) => {
        if (!isoStr) return "";
        try {
            const dateObj = new Date(isoStr);
            const hours = String(dateObj.getHours()).padStart(2, "0");
            const minutes = String(dateObj.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
        } catch (e) {
            console.error("Failed to parse date", isoStr, e);
            return "";
        }
    };

    // Fetch shift info on open
    useEffect(() => {
        const fetchShift = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/shifts/my-daily/${selectedDate}`);
                if (res.ok) {
                    const data = await res.json();
                    setShiftData(data);
                }
            } catch (e) {
                console.error("Failed to fetch shift", e);
            }
        };
        if (isOpen) {
            fetchShift();
        }
    }, [isOpen, selectedDate]);

    // Initialize/Reset inputs on open
    useEffect(() => {
        if (isOpen) {
            const defaultIn = shiftData?.start_time ? shiftData.start_time.substring(0, 5) : "09:00";
            const defaultOut = shiftData?.end_time ? shiftData.end_time.substring(0, 5) : "18:00";

            setNewClockIn(defaultIn);
            setNewClockOut(defaultOut);
            setReason("");
            setError(null);
        }
    }, [isOpen, shiftData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);

        const invalidTypes = ["PaidLeave", "公休", "全休", "有給", "有休"];
        if (shiftData && (shiftData.is_holiday || invalidTypes.includes(shiftData.shift_type))) {
            setError("休日のため申請できません。");
            setLoading(false);
            return;
        }

        // Helper to combine YYYY-MM-DD and HH:MM into ISO-like string
        const createISODatetime = (timeStr: string) => {
            if (!timeStr) return null;
            // Create a valid local ISO string format that FastAPI / python-dateutil can parse
            return `${selectedDate}T${timeStr}:00`;
        };

        const input_data = {
            correction_date: selectedDate,
            original_clock_in: initialClockIn,
            original_clock_out: initialClockOut,
            new_clock_in: createISODatetime(newClockIn),
            new_clock_out: createISODatetime(newClockOut),
            reason: reason
        };

        try {
            // First fetch templates to check if StampCorrection has a template_id
            const templateRes = await fetch(`${BACKEND_URL}/api/v1/application-templates/`);
            let templateId: string | undefined = undefined;
            if (templateRes.ok) {
                const templates = await templateRes.json();
                const template = templates.find((t: any) => t.name === "打刻修正申請" || t.name === "StampCorrection");
                if (template) {
                    templateId = template.id;
                }
            }

            const res = await fetch(`${BACKEND_URL}/api/v1/applications/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "StampCorrection",
                    template_id: templateId,
                    input_data: input_data
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "申請に失敗しました。");
            }

            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "通信エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>打刻修正申請</DialogTitle>
                    <DialogDescription>
                        {selectedDate} の打刻データを修正申請します。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>現在の打刻状態</Label>
                        <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded border">
                            出勤: {initialClockIn ? new Date(initialClockIn).toLocaleTimeString("ja-JP", { hour12: false, hour: '2-digit', minute: '2-digit' }) : "--:--"} / 
                            退勤: {initialClockOut ? new Date(initialClockOut).toLocaleTimeString("ja-JP", { hour12: false, hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newClockIn">修正後出勤時間</Label>
                            <Input
                                type="text"
                                id="newClockIn"
                                placeholder="09:00"
                                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                title="24時間形式 (例: 09:00)"
                                required
                                value={newClockIn}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length === 4 && !val.includes(":")) {
                                        val = val.substring(0, 2) + ":" + val.substring(2, 4);
                                    }
                                    setNewClockIn(val);
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newClockOut">修正後退勤時間</Label>
                            <Input
                                type="text"
                                id="newClockOut"
                                placeholder="18:00"
                                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                title="24時間形式 (例: 18:00)"
                                value={newClockOut}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length === 4 && !val.includes(":")) {
                                        val = val.substring(0, 2) + ":" + val.substring(2, 4);
                                    }
                                    setNewClockOut(val);
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="correctionReason">申請理由 <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="correctionReason"
                            placeholder="打刻忘れ、交通遅延など..."
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "申請する"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
