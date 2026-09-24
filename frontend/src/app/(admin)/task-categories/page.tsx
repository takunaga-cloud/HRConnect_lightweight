"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
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

interface TaskCategory {
    id: string;
    name: string;
}

export default function AdminTaskCategoriesPage() {
    const { isAuthenticated } = useAuth() || {};
    const [categories, setCategories] = useState<TaskCategory[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    useEffect(() => {
        fetchCategories();
    }, [isAuthenticated]);

    const fetchCategories = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/task-categories/`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch task categories", error);
        }
    };

    const handleOpenDialog = (category?: TaskCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingCategory
                ? `${BACKEND_URL}/api/v1/task-categories/${editingCategory.id}`
                : `${BACKEND_URL}/api/v1/task-categories/`;
            const method = editingCategory ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save task category");

            toast.success(editingCategory ? "更新完了" : "作成完了", {
                description: `日報区分を${editingCategory ? "更新" : "作成"}しました。`,
            });

            setIsDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error("エラー", {
                description: "保存に失敗しました。",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/task-categories/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete task category");

            toast.success("削除完了", {
                description: "日報区分を削除しました。",
            });

            fetchCategories();
        } catch (error) {
            toast.error("エラー", {
                description: "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="タスクカテゴリ管理"
                description="工数入力で使用する作業カテゴリ（設計、実装、会議等）をマスター管理します。"
                icon={Tag}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    新規日報区分作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>日報区分一覧</CardTitle>
                    <CardDescription>
                        現在登録されている日報区分です。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>区分名</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(category)}
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
                                                            この操作は取り消せません。使用中のデータがある場合、削除に失敗する可能性があります。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(category.id)}
                                                        >
                                                            削除
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        日報区分が登録されていません。
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "日報区分を編集" : "新規日報区分作成"}
                        </DialogTitle>
                        <DialogDescription>
                            日報区分の名称を入力してください。
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
                                    placeholder="開発、ミーティング、etc..."
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
