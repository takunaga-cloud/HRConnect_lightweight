"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
import { Textarea } from "@/components/ui/textarea";
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

interface ProjectRole {
    id: string;
    name: string;
    description?: string;
}

export default function ProjectRolesPage() {
    const { isAuthenticated } = useAuth() || {};
    const [roles, setRoles] = useState<ProjectRole[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    useEffect(() => {
        if (isAuthenticated) {
            fetchRoles();
        }
    }, [isAuthenticated]);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/project-roles/`);
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (error) {
            console.error("Failed to fetch project roles", error);
        }
    };

    const handleOpenDialog = (role?: ProjectRole) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, description: role.description || "" });
        } else {
            setEditingRole(null);
            setFormData({ name: "", description: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingRole
                ? `${BACKEND_URL}/api/v1/project-roles/${editingRole.id}`
                : `${BACKEND_URL}/api/v1/project-roles/`;
            const method = editingRole ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to save project role");
            }

            toast.success(editingRole ? "更新完了" : "作成完了", {
                description: `プロジェクト役割を${editingRole ? "更新" : "作成"}しました。`,
            });

            setIsDialogOpen(false);
            fetchRoles();
        } catch (error: any) {
            toast.error("エラー", {
                description: error.message || "保存に失敗しました。",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/project-roles/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete project role");

            toast.success("削除完了", {
                description: "プロジェクト役割を削除しました。",
            });

            fetchRoles();
        } catch (error) {
            toast.error("エラー", {
                description: "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="プロジェクト役職管理"
                description="プロジェクトアサイン時にメンバーに付与する職能・役職ロールを定義します。"
                icon={Award}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    新規役割作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>役割一覧</CardTitle>
                    <CardDescription>
                        現在登録されているプロジェクト役割です。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">役割名</TableHead>
                                <TableHead>説明</TableHead>
                                <TableHead className="text-right w-[100px]">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            {role.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {role.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(role)}
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
                                                            この操作は取り消せません。プロジェクトのアサイン情報で設定されている役割は未設定になります。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(role.id)}
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
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        役割が登録されていません。
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
                            {editingRole ? "役割を編集" : "新規役割作成"}
                        </DialogTitle>
                        <DialogDescription>
                            役割名と説明を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">役割名</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">説明</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
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
