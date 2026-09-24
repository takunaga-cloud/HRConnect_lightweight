"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
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

interface AffiliationGroup {
    id: string;
    name: string;
}

export default function AffiliationGroupsPage() {
    const { isAuthenticated } = useAuth() || {};
    const [groups, setGroups] = useState<AffiliationGroup[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<AffiliationGroup | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    useEffect(() => {
        if (isAuthenticated) {
            fetchGroups();
        }
    }, [isAuthenticated]);

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

    const handleOpenDialog = (group?: AffiliationGroup) => {
        if (group) {
            setEditingGroup(group);
            setFormData({ name: group.name });
        } else {
            setEditingGroup(null);
            setFormData({ name: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingGroup
                ? `${BACKEND_URL}/api/v1/affiliation-groups/${editingGroup.id}`
                : `${BACKEND_URL}/api/v1/affiliation-groups/`;
            const method = editingGroup ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save group");

            toast.success(editingGroup ? "更新完了" : "作成完了", {
                description: `所属グループを${editingGroup ? "更新" : "作成"}しました。`,
            });

            setIsDialogOpen(false);
            fetchGroups();
        } catch (error) {
            toast.error("エラー", {
                description: "保存に失敗しました。",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/affiliation-groups/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete group");

            toast.success("削除完了", {
                description: "所属グループを削除しました。",
            });

            fetchGroups();
        } catch (error) {
            toast.error("エラー", {
                description: "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="所属グループ管理"
                description="部署の上位概念となるグループ（本部・統括部など）を管理します。"
                icon={Layers}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    新規グループ作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>グループ一覧</CardTitle>
                    <CardDescription>
                        現在登録されている所属グループです。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>グループ名</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-muted-foreground" />
                                            {group.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(group)}
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
                                                            この操作は取り消せません。紐づく部署がある場合でも削除されます（※リレーション設定による）。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(group.id)}
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
                            {groups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        グループが登録されていません。
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
                            {editingGroup ? "グループを編集" : "新規グループ作成"}
                        </DialogTitle>
                        <DialogDescription>
                            グループ名を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">グループ名</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
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
