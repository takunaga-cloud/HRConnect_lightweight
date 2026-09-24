"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, CalendarCheck } from "lucide-react";
import { BACKEND_URL } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";

interface Application {
    id: string;
    user_id: string;
    type: string;
    status: string;
    input_data: any;
    created_at: string;
    user?: {
        id: string;
        name: string;
        user_id?: string;
    };
    approver?: {
        id: string;
        name: string;
        user_id?: string;
    };
    approver_id?: string;
}

export default function ApplicationsPage() {
    const { isAuthenticated } = useAuth() || {};
    const [applications, setApplications] = useState<Application[]>([]);
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [userFilter, setUserFilter] = useState("ALL");

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});

    useEffect(() => {
        if (isAuthenticated) fetchApplications();
    }, [isAuthenticated, statusFilter]);

    const fetchApplications = async () => {
        try {
            const baseUrl = BACKEND_URL.replace(/\/$/, "");
            let url = `${baseUrl}/api/v1/applications/`;

            if (statusFilter !== "All") {
                url += `?status=${statusFilter}`;
            }

            const res = await fetch(url);

            if (res.ok) {
                setApplications(await res.json());
                setSelectedIds(new Set()); // Reset selection on fetch
            } else {
                console.error("Failed to fetch applications:", res.status, res.statusText);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(applications.map(app => app.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`選択された ${selectedIds.size} 件の申請を削除しますか？取り消せません。`)) return;

        let successCount = 0;
        for (const id of Array.from(selectedIds)) {
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/applications/${id}`, {
                    method: "DELETE",
                });
                if (res.ok) successCount++;
            } catch (e) {
                console.error(e);
            }
        }

        alert(`${successCount} 件削除しました`);
        fetchApplications();
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`選択された ${selectedIds.size} 件の申請を承認しますか？`)) return;

        let successCount = 0;
        for (const id of Array.from(selectedIds)) {
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/applications/${id}/approve`, {
                    method: "PATCH",
                });
                if (res.ok) successCount++;
            } catch (e) {
                console.error(e);
            }
        }

        alert(`${successCount} 件承認しました`);
        fetchApplications();
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`${action === 'approve' ? '承認' : '却下'}しますか？`)) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/applications/${id}/${action}`, {
                method: "PATCH",
            });
            if (res.ok) {
                alert("完了しました");
                fetchApplications();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e: any) {
            console.error("Fetch error details:", e);
            alert(`エラーが発生しました: ${e.message}`);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？取り消せません。")) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/applications/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("削除しました");
                fetchApplications();
            } else {
                alert("削除に失敗しました");
            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleEdit = (app: Application) => {
        setEditingApp(app);
        // Deep copy to avoid reference issues
        const data = JSON.parse(JSON.stringify(app.input_data || {}));
        if (app.type === 'PaidLeave') {
            if (data.leave_start_date) data.leave_start_date = data.leave_start_date.replace(/-/g, "/");
            if (data.leave_end_date) data.leave_end_date = data.leave_end_date.replace(/-/g, "/");
        } else if (app.type === 'Overtime') {
            if (data.date) data.date = data.date.replace(/-/g, "/");
        } else if (app.type === 'StampCorrection') {
            if (data.correction_date) data.correction_date = data.correction_date.replace(/-/g, "/");
        }
        setEditFormData(data);
        setIsEditDialogOpen(true);
    }

    const handleSaveEdit = async () => {
        if (!editingApp) return;
        try {
            const data = JSON.parse(JSON.stringify(editFormData || {}));
            if (editingApp.type === 'PaidLeave') {
                if (data.leave_start_date) data.leave_start_date = data.leave_start_date.replace(/\//g, "-");
                if (data.leave_end_date) data.leave_end_date = data.leave_end_date.replace(/\//g, "-");
            } else if (editingApp.type === 'Overtime') {
                if (data.date) data.date = data.date.replace(/\//g, "-");
            } else if (editingApp.type === 'StampCorrection') {
                if (data.correction_date) data.correction_date = data.correction_date.replace(/\//g, "-");
            }
            const res = await fetch(`${BACKEND_URL}/api/v1/applications/${editingApp.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input_data: data
                })
            });

            if (res.ok) {
                alert("更新しました");
                setIsEditDialogOpen(false);
                fetchApplications();
            } else {
                alert("更新に失敗しました");
            }
        } catch (e) {
            console.error(e);
        }
    }

    const updateFormData = (key: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [key]: value }));
    }

    const renderEditForm = () => {
        if (!editingApp) return null;

        if (editingApp.type === 'PaidLeave') {
            return (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>開始日</Label>
                            <DateInput value={editFormData.leave_start_date || ''} onChange={(val) => updateFormData('leave_start_date', val)} />
                        </div>
                        <div>
                            <Label>終了日</Label>
                            <DateInput value={editFormData.leave_end_date || ''} onChange={(val) => updateFormData('leave_end_date', val)} />
                        </div>
                    </div>
                    <div>
                        <Label>種別</Label>
                        <Select value={editFormData.leave_type} onValueChange={(val) => updateFormData('leave_type', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="種別を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FullDay">全日休暇</SelectItem>
                                <SelectItem value="HalfDayMorning">午前休暇</SelectItem>
                                <SelectItem value="HalfDayAfternoon">午後休暇</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>理由</Label>
                        <Textarea value={editFormData.reason || ''} onChange={(e) => updateFormData('reason', e.target.value)} />
                    </div>
                </div>
            );
        } else if (editingApp.type === 'Overtime') {
            return (
                <div className="grid gap-4 py-4">
                    <div>
                        <Label>日付</Label>
                        <DateInput value={editFormData.date || ''} onChange={(val) => updateFormData('date', val)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>開始時間</Label>
                            <Input type="time" value={editFormData.start_time || ''} onChange={(e) => updateFormData('start_time', e.target.value)} />
                        </div>
                        <div>
                            <Label>終了時間</Label>
                            <Input type="time" value={editFormData.end_time || ''} onChange={(e) => updateFormData('end_time', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>理由</Label>
                        <Textarea value={editFormData.reason || ''} onChange={(e) => updateFormData('reason', e.target.value)} />
                    </div>
                </div>
            );
        } else if (editingApp.type === 'StampCorrection') {
            return (
                <div className="grid gap-4 py-4">
                    <div>
                        <Label>修正対象日</Label>
                        <DateInput value={editFormData.correction_date || ''} onChange={(val) => updateFormData('correction_date', val)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>出勤時間</Label>
                            <Input type="datetime-local" value={editFormData.new_clock_in ? editFormData.new_clock_in.substring(0, 16) : ''} onChange={(e) => updateFormData('new_clock_in', e.target.value)} />
                        </div>
                        <div>
                            <Label>退勤時間</Label>
                            <Input type="datetime-local" value={editFormData.new_clock_out ? editFormData.new_clock_out.substring(0, 16) : ''} onChange={(e) => updateFormData('new_clock_out', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>修正理由</Label>
                        <Textarea value={editFormData.reason || ''} onChange={(e) => updateFormData('reason', e.target.value)} />
                    </div>
                </div>
            );
        }

        // Fallback for generic JSON editing
        return (
            <div className="py-4">
                <Label>申請データ (JSON)</Label>
                <Textarea
                    className="mt-2 font-mono"
                    rows={10}
                    value={typeof editFormData === 'string' ? editFormData : JSON.stringify(editFormData, null, 2)}
                    onChange={(e) => {
                        try {
                            setEditFormData(JSON.parse(e.target.value));
                        } catch (err) { }
                    }}
                />
                <p className="text-xs text-yellow-600 mt-1">※ この申請タイプは専用フォームが未実装のため、直接編集は推奨されません。</p>
            </div>
        );
    }

    const formatDetail = (app: Application) => {
        const data = app.input_data;
        if (!data) return "データなし";

        if (app.type === 'PaidLeave') {
            return (
                <div className="text-sm space-y-1">
                    <div><span className="font-semibold">期間:</span> {data.leave_start_date} ~ {data.leave_end_date}</div>
                    <div><span className="font-semibold">種別:</span> {
                        data.leave_type === 'FullDay' ? '全日' :
                            data.leave_type === 'HalfDayMorning' ? '午前半休' : '午後半休'
                    }</div>
                    {data.reason && <div><span className="font-semibold">理由:</span> {data.reason}</div>}
                </div>
            )
        } else if (app.type === 'Overtime') {
            return (
                <div className="text-sm space-y-1">
                    <div><span className="font-semibold">日付:</span> {data.date}</div>
                    <div><span className="font-semibold">時間:</span> {data.start_time} ~ {data.end_time}</div>
                    {data.reason && <div><span className="font-semibold">理由:</span> {data.reason}</div>}
                </div>
            )
        } else if (app.type === 'StampCorrection') {
            return (
                <div className="text-sm space-y-1">
                    <div><span className="font-semibold">対象日:</span> {data.correction_date}</div>
                    <div><span className="font-semibold">修正後:</span> {data.new_clock_in ? format(new Date(data.new_clock_in), 'HH:mm') : '-'} ~ {data.new_clock_out ? format(new Date(data.new_clock_out), 'HH:mm') : '-'}</div>
                    {data.reason && <div><span className="font-semibold">理由:</span> {data.reason}</div>}
                </div>
            )
        }

        return <pre className="text-xs bg-gray-50 p-1 rounded max-w-[200px] overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="申請管理"
                description="全従業員からの各種申請（有給休暇・残業・打刻修正など）の一括確認・承認・却下・編集を行います。"
                icon={CalendarCheck}
            >
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {selectedIds.size > 0 && (
                        <>
                            <Button
                                onClick={handleBulkApprove}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm px-3 py-1"
                            >
                                選択した {selectedIds.size} 件を承認
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                size="sm"
                                className="text-xs md:text-sm px-3 py-1"
                            >
                                選択した {selectedIds.size} 件を削除
                            </Button>
                        </>
                    )}

                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="従業員フィルタ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">全従業員</SelectItem>
                            {Array.from(new Set(applications.map(app => app.user?.id || app.user_id))).map(userId => {
                                const user = applications.find(a => (a.user?.id || a.user_id) === userId)?.user;
                                return (
                                    <SelectItem key={userId} value={userId}>
                                        {user?.name || userId}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="ステータス" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">全て</SelectItem>
                            <SelectItem value="Pending">承認待ち</SelectItem>
                            <SelectItem value="Approved">承認済み</SelectItem>
                            <SelectItem value="Rejected">却下</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>


            <div className="relative w-full overflow-auto max-h-[75vh] border rounded-md">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="sticky top-0 z-20 bg-background">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    checked={applications.length > 0 && selectedIds.size === applications.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">No.</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">従業員番号</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">従業員名</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">申請日</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">申請番号</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">申請内容</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">申請理由</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">承認フラグ</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">承認者番号</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">承認者名</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">承認日</th>

                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">操作</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {applications.filter(app => userFilter === "ALL" || (app.user?.id || app.user_id) === userFilter).map((app, index) => (
                            <tr key={app.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedIds.has(app.id)}
                                        onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                                    />
                                </td>
                                <td className="p-4 align-middle">
                                    {index + 1}
                                </td>
                                <td className="p-4 align-middle">
                                    {app.user?.user_id || '-'}
                                </td>
                                <td className="p-4 align-middle font-medium">
                                    {app.user?.name || '-'}
                                </td>
                                <td className="p-4 align-middle">
                                    {format(new Date(app.created_at), "yyyy/MM/dd", { locale: ja })}
                                </td>
                                <td className="p-4 align-middle font-mono text-xs">
                                    {app.id.substring(0, 8)}...
                                </td>
                                <td className="p-4 align-middle font-medium">
                                    {app.type === 'PaidLeave' ? '有給休暇' :
                                        app.type === 'Overtime' ? '残業申請' :
                                            app.type === 'StampCorrection' ? '打刻修正' : app.type}
                                </td>
                                <td className="p-4 align-middle max-w-xs truncate">
                                    {app.input_data?.reason || '-'}
                                </td>
                                <td className="p-4 align-middle">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            app.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {app.status === 'Pending' ? '承認待ち' :
                                            app.status === 'Approved' ? '承認済み' : '却下'}
                                    </span>
                                </td>
                                <td className="p-4 align-middle">
                                    {app.approver?.user_id || '-'}
                                </td>
                                <td className="p-4 align-middle">
                                    {app.approver?.name || '-'}
                                </td>
                                <td className="p-4 align-middle">
                                    -
                                </td>

                                <td className="p-4 align-middle flex items-center">
                                    {app.status === 'Pending' && (
                                        <div className="flex gap-2 mr-2">
                                            <Button
                                                onClick={() => handleAction(app.id, 'approve')}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                承認
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(app.id, 'reject')}
                                                size="sm"
                                                variant="destructive"
                                            >
                                                却下
                                            </Button>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => handleEdit(app)}
                                        size="sm"
                                        variant="outline"
                                        className="mr-2 text-blue-600 hover:text-blue-900"
                                    >
                                        編集
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(app.id)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title="削除"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}


                        {applications.filter(app => userFilter === "ALL" || (app.user?.id || app.user_id) === userFilter).length === 0 && (
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td colSpan={13} className="p-4 align-middle h-24 text-center text-muted-foreground">
                                    申請はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>申請内容の編集</DialogTitle>
                    </DialogHeader>

                    {renderEditForm()}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSaveEdit}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
