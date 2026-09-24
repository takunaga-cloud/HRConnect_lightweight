"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

interface ShiftTemplate {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
}

export default function AdminAttendanceCategoriesPage() {
    const { isAuthenticated } = useAuth() || {}
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        start_time: "09:00",
        end_time: "18:00",
        break_minutes: 60,
    });
    // Filter State
    const [filterName, setFilterName] = useState("");

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(filterName.toLowerCase())
    );

    useEffect(() => {
        fetchTemplates();
    }, [isAuthenticated]);

    const fetchTemplates = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/shift-templates/`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch shift templates", error);
        }
    };

    const handleOpenDialog = (template?: ShiftTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                start_time: template.start_time.substring(0, 5),
                end_time: template.end_time.substring(0, 5),
                break_minutes: template.break_minutes,
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: "",
                start_time: "09:00",
                end_time: "18:00",
                break_minutes: 60,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingTemplate
                ? `${BACKEND_URL}/api/v1/shift-templates/${editingTemplate.id}`
                : `${BACKEND_URL}/api/v1/shift-templates/`;
            const method = editingTemplate ? "PUT" : "POST";

            // Format times to include seconds if needed, but usually HH:MM is enough for input.
            // Backend expects HH:MM:SS object or string.
            const payload = {
                name: formData.name,
                start_time: formData.start_time, // + ":00",
                end_time: formData.end_time, // + ":00",
                break_minutes: Number(formData.break_minutes),
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save shift template");

            toast.success(editingTemplate ? "更新完了" : "作成完了", {
                description: `勤怠区分を${editingTemplate ? "更新" : "作成"}しました。`,
            });

            setIsDialogOpen(false);
            fetchTemplates();
        } catch (error) {
            toast.error("エラー", {
                description: "保存に失敗しました。",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/shift-templates/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete shift template");

            toast.success("削除完了", {
                description: "勤怠区分を削除しました。",
            });

            fetchTemplates();
        } catch (error) {
            toast.error("エラー", {
                description: "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="勤怠区分管理"
                description="出勤、欠勤、有給、遅刻などの各種勤怠区分ルールを管理します。"
                icon={Clock}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    新規区分作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>勤怠区分一覧</CardTitle>
                    <CardDescription>
                        現在登録されている勤怠区分です。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Label>名称検索:</Label>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="区分名で検索"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="relative w-full overflow-auto max-h-[75vh] border rounded-md">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="sticky top-0 z-20 bg-background">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">区分名</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">開始時間</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">終了時間</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">休憩時間</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredTemplates.map((template) => (
                                        <tr key={template.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {template.name}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">{template.start_time.substring(0, 5)}</td>
                                            <td className="p-4 align-middle">{template.end_time.substring(0, 5)}</td>
                                            <td className="p-4 align-middle">{template.break_minutes}分</td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(template)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    この操作は取り消せません。使用中のシフトがある場合、不整合が生じる可能性があります。
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    onClick={() => handleDelete(template.id)}
                                                                >
                                                                    削除
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTemplates.length === 0 && (
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td colSpan={5} className="p-4 align-middle h-24 text-center">
                                                条件に一致する勤怠区分がありません。
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? "勤怠区分を編集" : "新規勤怠区分作成"}
                        </DialogTitle>
                        <DialogDescription>
                            勤務パターンの詳細を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">区分名</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="例: A直"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_time">開始時間</Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) =>
                                            setFormData({ ...formData, start_time: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_time">終了時間</Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) =>
                                            setFormData({ ...formData, end_time: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="break_minutes">休憩時間 (分)</Label>
                                <Input
                                    id="break_minutes"
                                    type="number"
                                    value={formData.break_minutes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, break_minutes: Number(e.target.value) })
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">保存</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
