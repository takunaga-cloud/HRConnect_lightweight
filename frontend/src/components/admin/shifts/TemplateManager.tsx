import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"

interface TemplateManagerProps {
    templates: ShiftTemplate[]
    onUpdate: () => void
}

export function TemplateManager({ templates, onUpdate }: TemplateManagerProps) {
    const { isAuthenticated } = useAuth() || {}
    const [isOpen, setIsOpen] = useState(false)
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        start_time: "09:00",
        end_time: "18:00",
        break_minutes: 60
    })

    const handleCreateTemplate = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shift-templates/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newTemplate,
                    start_time: newTemplate.start_time + ":00",
                    end_time: newTemplate.end_time + ":00"
                })
            });
            if (res.ok) {
                onUpdate();
                setNewTemplate({ name: "", start_time: "09:00", end_time: "18:00", break_minutes: 60 });
            }
        } catch (e) { console.error(e); }
    }

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm("テンプレートを削除しますか？")) return;
        if (!isAuthenticated) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shift-templates/" + id, {
                method: "DELETE"
            });
            if (res.ok) onUpdate();
        } catch (e) { console.error(e); }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-950/80 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white text-xs md:text-sm px-3 py-1">テンプレート管理</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>テンプレート管理</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2 items-end border-b pb-4">
                        <div className="grid gap-2">
                            <Label>名前</Label>
                            <Input placeholder="早番" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>開始</Label>
                            <Input type="time" value={newTemplate.start_time} onChange={(e) => setNewTemplate({ ...newTemplate, start_time: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>終了</Label>
                            <Input type="time" value={newTemplate.end_time} onChange={(e) => setNewTemplate({ ...newTemplate, end_time: e.target.value })} />
                        </div>
                        <div className="grid gap-2 w-20">
                            <Label>休憩(分)</Label>
                            <Input type="number" value={newTemplate.break_minutes} onChange={(e) => setNewTemplate({ ...newTemplate, break_minutes: parseInt(e.target.value) })} />
                        </div>
                        <Button onClick={handleCreateTemplate}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                        {templates.map(t => (
                            <div key={t.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div>
                                    <span className="font-bold mr-2">{t.name}</span>
                                    <span className="text-sm text-gray-500">{t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)} (休 {t.break_minutes}分)</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        ))}
                        {templates.length === 0 && <p className="text-center text-sm text-gray-500">テンプレートがありません</p>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
