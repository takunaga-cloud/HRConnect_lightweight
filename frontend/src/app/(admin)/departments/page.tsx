"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building, Layers } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Department {
    id: string;
    name: string;
    affiliation_group_id?: string | null;
    affiliation_group?: {
        id: string;
        name: string;
    } | null;
}

interface AffiliationGroup {
    id: string;
    name: string;
}

export default function DepartmentsPage() {
    const { isAuthenticated } = useAuth() || {};
    const [departments, setDepartments] = useState<Department[]>([]);
    const [groups, setGroups] = useState<AffiliationGroup[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: "", affiliation_group_id: "none" });

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchDepartments();
        fetchGroups();
    }, [isAuthenticated]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/departments/`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/affiliation-groups/`);
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

    const handleOpenDialog = (department?: Department) => {
        if (department) {
            setEditingDepartment(department);
            setFormData({
                name: department.name,
                affiliation_group_id: department.affiliation_group_id || "none",
            });
        } else {
            setEditingDepartment(null);
            setFormData({ name: "", affiliation_group_id: "none" });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingDepartment
                ? `${BACKEND_URL}/api/v1/departments/${editingDepartment.id}`
                : `${BACKEND_URL}/api/v1/departments/`;
            const method = editingDepartment ? "PUT" : "POST";

            const payload = {
                name: formData.name,
                affiliation_group_id: formData.affiliation_group_id === "none" ? null : formData.affiliation_group_id,
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save department");

            toast.success(editingDepartment ? "更新完了" : "作成完了", {
                description: `部署を${editingDepartment ? "更新" : "作成"}しました。`,
            });

            setIsDialogOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error("エラー", {
                description: "保存に失敗しました。",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/departments/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete department");

            toast.success("削除完了", {
                description: "部署を削除しました。",
            });

            fetchDepartments();
        } catch (error) {
            toast.error("エラー", {
                description: "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="部署管理"
                description="社内の所属部署と組織階層を定義・管理します。"
                icon={Building}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    新規部署作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>部署一覧</CardTitle>
                    <CardDescription>
                        現在登録されている部署です。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>部署名</TableHead>
                                <TableHead>所属グループ</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            {dept.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {dept.affiliation_group ? (
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-muted-foreground" />
                                                {dept.affiliation_group.name}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(dept)}
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
                                                            この操作は取り消せません。所属するユーザーがいる場合は削除できません。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(dept.id)}
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
                            {departments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        部署が登録されていません。
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
                            {editingDepartment ? "部署を編集" : "新規部署作成"}
                        </DialogTitle>
                        <DialogDescription>
                            部署情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">部署名</Label>
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
                                <Label htmlFor="group">所属グループ</Label>
                                <Select
                                    value={formData.affiliation_group_id}
                                    onValueChange={(val) =>
                                        setFormData({ ...formData, affiliation_group_id: val })
                                    }
                                >
                                    <SelectTrigger id="group">
                                        <SelectValue placeholder="所属グループを選択（任意）" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">指定なし</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
