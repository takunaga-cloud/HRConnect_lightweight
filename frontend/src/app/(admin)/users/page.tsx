"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { UserCog, Pencil, Building, User as UserIcon, Clock, Plus, Trash2 } from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
}

interface WorkRule {
    id: string;
    name: string;
}

interface User {
    id: string;
    user_id?: string;
    name: string;
    email: string;
    role: string;
    status: string;
    department_id: string | null;
    work_rule_id: string;
    department?: Department | null;
    hourly_rate?: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [workRules, setWorkRules] = useState<WorkRule[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        role: "Employee",
        department_id: "none",
        work_rule_id: "",
        status: "Active",
        user_id: "",
        name: "",
        email: "",
        password: "",
        hourly_rate: "0",
    });

    // Filters
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterDept, setFilterDept] = useState("ALL");

    const filteredUsers = users.filter(u => {
        const matchRole = filterRole === "ALL" || u.role === filterRole;
        const matchDept = filterDept === "ALL" ||
            (filterDept === "none" && !u.department_id) ||
            u.department_id === filterDept;
        return matchRole && matchDept;
    });

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
        fetchWorkRules();
    }, []);


    const fetchUsers = async () => {
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/users/");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/departments/");
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchWorkRules = async () => {
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/work-rules/");
            if (res.ok) {
                const data = await res.json();
                setWorkRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch work rules", error);
        }
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                role: user.role,
                department_id: user.department_id || "none",
                work_rule_id: user.work_rule_id,
                status: user.status,
                user_id: user.user_id || "",
                name: user.name,
                email: user.email,
                password: "", // Password update optional
                hourly_rate: String(user.hourly_rate ?? 0),
            });
        } else {
            setEditingUser(null);
            setFormData({
                role: "Employee",
                department_id: "none",
                work_rule_id: "",
                status: "Active",
                user_id: "",
                name: "",
                email: "",
                password: "",
                hourly_rate: "0",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                // Update
                const body = {
                    user_id: formData.user_id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || undefined, // Only send if set
                    role: formData.role,
                    department_id: formData.department_id === "none" ? null : formData.department_id,
                    work_rule_id: formData.work_rule_id,
                    status: formData.status,
                    hourly_rate: Number(formData.hourly_rate) || 0,
                };

                const res = await fetch(`${BACKEND_URL}/api/v1/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) throw new Error("Failed to update user");

                toast.success("更新完了", {
                    description: "ユーザー情報を更新しました。",
                });
            } else {
                // Create
                const body = {
                    user_id: formData.user_id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    department_id: formData.department_id === "none" ? null : formData.department_id,
                    work_rule_id: formData.work_rule_id,
                    status: formData.status,
                    hourly_rate: Number(formData.hourly_rate) || 0,
                };

                const res = await fetch(`${BACKEND_URL}/api/v1/users/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to create user");
                }

                toast.success("登録完了", {
                    description: "新しいユーザーを追加しました。",
                });
            }

            setIsDialogOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error("エラー", {
                description: error.message || "更新に失敗しました。",
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "Admin":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "Manager":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "Leader":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "Admin":
                return "システム管理者";
            case "Manager":
                return "管理者/部門長";
            case "Leader":
                return "リーダー";
            case "HR_Payroll":
                return "人事労務";
            case "Employee":
                return "一般社員";
            default:
                return role;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "Active":
                return "有効";
            case "Retired":
                return "退職済";
            case "Suspended":
                return "停止中";
            default:
                return status;
        }
    };

    const getWorkRuleName = (id: string) => {
        const rule = workRules.find(r => r.id === id);
        return rule ? rule.name : "不明";
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("このユーザーを削除しますか？この操作は取り消せません。")) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/users/${userId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete user");

            toast.success("削除完了", {
                description: "ユーザーを削除しました。",
            });
            fetchUsers();
        } catch (error: any) {
            toast.error("エラー", {
                description: error.message || "削除に失敗しました。",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="ユーザー管理"
                description="システムを利用する全従業員のアカウント情報、権限、所属部門、勤務ルールを管理します。"
                icon={UserCog}
            />

            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">ユーザー一覧</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                        全ユーザーのリストです。編集ボタンから設定を変更できます。
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4 items-stretch sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="ロールフィルタ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">全てのロール</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Leader">Leader</SelectItem>
                                    <SelectItem value="HR_Payroll">HR_Payroll</SelectItem>
                                    <SelectItem value="Employee">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterDept} onValueChange={setFilterDept}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="部門フィルタ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">全ての部門</SelectItem>
                                    <SelectItem value="none">所属なし</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            新規登録
                        </Button>
                    </div>

                    <div className="relative w-full overflow-auto max-h-[75vh] border rounded-md">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="sticky top-0 z-20 bg-background">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">従業員番号</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">氏名</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">メールアドレス</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">部門</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">勤務ルール</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">時間単価</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">ロール</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">ステータス</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{user.user_id}</td>
                                        <td className="p-4 align-middle font-medium">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">{user.email}</td>
                                        <td className="p-4 align-middle">
                                            {user.department ? (
                                                <div className="flex items-center gap-1">
                                                    <Building className="h-3 w-3 text-muted-foreground" />
                                                    {user.department.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {getWorkRuleName(user.work_rule_id)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {user.hourly_rate !== undefined ? `${user.hourly_rate.toLocaleString()} 円` : "0 円"}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                                                    user.role
                                                )}`}
                                            >
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">{getStatusLabel(user.status)}</td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(user)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent >
            </Card >

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "ユーザー情報を編集" : "新規ユーザー登録"}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? `${editingUser.name} (${editingUser.email}) の設定を変更します。`
                                : "新しいユーザーアカウントを作成します。"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="user_id">従業員番号</Label>
                                <Input
                                    id="user_id"
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    required
                                    maxLength={12}
                                    pattern="^[a-zA-Z0-9]+$"
                                    placeholder="半角英数字 (最大12桁)"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">氏名</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">メールアドレス</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">パスワード {editingUser && "(変更する場合のみ入力)"}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    placeholder={editingUser ? "変更しない場合は空欄" : ""}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">ロール (権限)</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="ロールを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Employee">Employee (一般)</SelectItem>
                                        <SelectItem value="Leader">Leader (リーダー)</SelectItem>
                                        <SelectItem value="Manager">Manager (管理者/部門長)</SelectItem>
                                        <SelectItem value="HR_Payroll">HR_Payroll (人事労務)</SelectItem>
                                        <SelectItem value="Admin">Admin (システム管理者)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="department">所属部門</Label>
                                <Select
                                    value={formData.department_id}
                                    onValueChange={(val) =>
                                        setFormData({ ...formData, department_id: val })
                                    }
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="部門を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">所属なし</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="work_rule">勤務ルール</Label>
                                <Select
                                    value={formData.work_rule_id}
                                    onValueChange={(val) =>
                                        setFormData({ ...formData, work_rule_id: val })
                                    }
                                >
                                    <SelectTrigger id="work_rule">
                                        <SelectValue placeholder="勤務ルールを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workRules.map((rule) => (
                                            <SelectItem key={rule.id} value={rule.id}>
                                                {rule.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">ステータス</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="ステータスを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active (有効)</SelectItem>
                                        <SelectItem value="Retired">Retired (退職済)</SelectItem>
                                        <SelectItem value="Suspended">Suspended (停止中)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{editingUser ? "更新" : "登録"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
