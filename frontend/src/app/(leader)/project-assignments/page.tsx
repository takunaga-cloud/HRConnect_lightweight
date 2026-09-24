"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Save, FolderGit } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: {
        name: string;
    };
}

interface Project {
    id: string;
    code: string;
    name: string;
    members?: User[];
}

interface ProjectRole {
    id: string;
    name: string;
}

export default function ProjectAssignmentsPage() {
    const { isAuthenticated, user } = useAuth() || {};
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [memberRoles, setMemberRoles] = useState<{ [userId: string]: string }>({});
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const [projRes, userRes, roleRes] = await Promise.all([
                fetch(BACKEND_URL + "/api/v1/projects/admin"),
                fetch(BACKEND_URL + "/api/v1/users/"),
                fetch(BACKEND_URL + "/api/v1/project-roles/"),
            ]);

            if (projRes.ok && userRes.ok && roleRes.ok) {
                const projs = await projRes.json();
                const allUsers = await userRes.json();
                const allRoles = await roleRes.json();
                setProjects(projs);
                setUsers(allUsers);
                setProjectRoles(allRoles);

                if (projs.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projs[0].id);
                }
            } else {
                toast.error("データの取得に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAuthenticated]);

    useEffect(() => {
        if (user) {
            const u = user as any;
            if (u.department?.name) {
                setSelectedDepartment(u.department.name);
            }
        }
    }, [user]);

    useEffect(() => {
        const project = projects.find((p) => p.id === selectedProjectId);
        if (project && project.members) {
            setSelectedMemberIds(project.members.map((m) => m.id));
            const rolesMap: { [userId: string]: string } = {};
            project.members.forEach((m: any) => {
                if (m.project_role_id) {
                    rolesMap[m.id] = m.project_role_id;
                }
            });
            setMemberRoles(rolesMap);
        } else {
            setSelectedMemberIds([]);
            setMemberRoles({});
        }
    }, [selectedProjectId, projects]);

    const handleToggleMember = (userId: string) => {
        setSelectedMemberIds((prev) => {
            const exists = prev.includes(userId);
            if (exists) {
                setMemberRoles((prevRoles) => {
                    const next = { ...prevRoles };
                    delete next[userId];
                    return next;
                });
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleRoleChange = (userId: string, roleId: string) => {
        setMemberRoles((prev) => ({
            ...prev,
            [userId]: roleId === "none" ? "" : roleId,
        }));
    };

    const handleSave = async () => {
        if (!isAuthenticated || !selectedProjectId) return;
        setIsSubmitting(true);
        try {
            const memberAssignments = selectedMemberIds.map((uid) => ({
                user_id: uid,
                role_id: memberRoles[uid] || null,
            }));

            const res = await fetch(BACKEND_URL + "/api/v1/projects/" + selectedProjectId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    member_ids: selectedMemberIds,
                    member_assignments: memberAssignments,
                }),
            });

            if (res.ok) {
                toast.success("担当プロジェクトを更新しました");
                fetchData();
            } else {
                toast.error("更新に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="担当プロジェクト登録"
                description="リーダーが担当しているプロジェクトへのメンバーアサインと稼働状況を管理します。"
                icon={FolderGit}
            />

            <Card>
                <CardHeader>
                    <CardTitle>プロジェクト選択</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="プロジェクトを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        [{p.code}] {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} disabled={isSubmitting || !selectedProjectId}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            保存
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>メンバー選択</CardTitle>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="部門でフィルタ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部門</SelectItem>
                                {Array.from(new Set(users.map(u => u.department?.name).filter(Boolean))).map((dept) => (
                                    <SelectItem key={dept as string} value={dept as string}>
                                        {dept as string}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto max-h-[600px] border rounded-md">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="sticky top-0 z-20 bg-background">
                                    <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[50px] border-b">選択</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b">部門</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b">氏名</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b">メールアドレス</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b">ロール</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 border-b w-[200px]">プロジェクト役割</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {users.filter(u => selectedDepartment === "all" || u.department?.name === selectedDepartment).map((user) => (
                                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle">
                                                <Checkbox
                                                    checked={selectedMemberIds.includes(user.id)}
                                                    onCheckedChange={() => handleToggleMember(user.id)}
                                                />
                                            </td>
                                            <td className="p-4 align-middle">{user.department?.name || "-"}</td>
                                            <td className="p-4 align-middle font-medium">{user.name}</td>
                                            <td className="p-4 align-middle">{user.email}</td>
                                            <td className="p-4 align-middle">{user.role}</td>
                                            <td className="p-4 align-middle">
                                                <Select
                                                    disabled={!selectedMemberIds.includes(user.id)}
                                                    value={memberRoles[user.id] || "none"}
                                                    onValueChange={(val) => handleRoleChange(user.id, val)}
                                                >
                                                    <SelectTrigger className="h-9 w-full">
                                                        <SelectValue placeholder="未割り当て" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">未割り当て</SelectItem>
                                                        {projectRoles.map((role) => (
                                                            <SelectItem key={role.id} value={role.id}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
