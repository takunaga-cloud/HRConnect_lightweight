"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, BadgeCheck, Clock, CalendarCheck } from "lucide-react";
import { User } from "@/types";
import { PageHeader } from "@/components/layout/page-header";

interface LeaveType {
    id: string;
    name: string;
    is_paid: boolean;
    is_system: boolean;
}

interface LeaveLedger {
    id: string;
    grant_date: string;
    expire_date: string;
    days_granted: number;
    days_used: number;
}

interface LeaveHistoryItem {
    date: string;
    type: string;
    amount: number;
    description: string;
}

interface LeaveLedgerSummary {
    leave_type: LeaveType;
    total_granted: number;
    total_used: number;
    current_balance: number;
    ledgers: LeaveLedger[];
    history: LeaveHistoryItem[];
}

interface UserLeaveSummary {
    user_id: string;
    summaries: LeaveLedgerSummary[];
}



export default function AdminPaidLeavesPage() {
    const { isAuthenticated } = useAuth() || {};
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>("");
    const [userSummary, setUserSummary] = useState<UserLeaveSummary | null>(null);

    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isGranting, setIsGranting] = useState(false);

    // Grant Form
    const [grantDate, setGrantDate] = useState(format(new Date(), "yyyy/MM/dd"));
    const [daysGranted, setDaysGranted] = useState("10");
    const [customExpireDate, setCustomExpireDate] = useState("");
    const [formLeaveTypeId, setFormLeaveTypeId] = useState("");

    // 1. Fetch Users & Leave Types
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchInitialData = async () => {
            setIsLoadingUsers(true);
            try {
                // Fetch Users
                const usersRes = await fetch(BACKEND_URL + "/api/v1/users/");
                if (usersRes.ok) {
                    setUsers(await usersRes.json());
                }
                // Fetch Leave Types
                const typesRes = await fetch(BACKEND_URL + "/api/v1/paid-leaves/types");
                if (typesRes.ok) {
                    const types = await typesRes.json();
                    setLeaveTypes(types);
                    if (types.length > 0) {
                        setSelectedLeaveTypeId(types[0].id);
                        setFormLeaveTypeId(types[0].id);
                    }
                }
            } catch (e) { 
                console.error(e); 
            } finally { 
                setIsLoadingUsers(false); 
            }
        };
        fetchInitialData();
    }, [isAuthenticated]);

    // 2. Fetch Summary when user selected
    const fetchSummary = async () => {
        if (!isAuthenticated || !selectedUserId) {
            setUserSummary(null);
            return;
        }
        setIsLoadingSummary(true);
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/paid-leaves/ledgers/user/" + selectedUserId);
            if (res.ok) {
                setUserSummary(await res.json());
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            setIsLoadingSummary(false); 
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [isAuthenticated, selectedUserId]);

    // Get currently active summary based on selected Tab/LeaveType
    const activeSummary = useMemo(() => {
        if (!userSummary || !selectedLeaveTypeId) return null;
        return userSummary.summaries.find(s => s.leave_type.id === selectedLeaveTypeId) || null;
    }, [userSummary, selectedLeaveTypeId]);

    const carryoverAndCurrent = useMemo(() => {
        if (!activeSummary || activeSummary.leave_type.name !== "有給休暇") return null;
        
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        let carryoverBalance = 0;
        let currentBalance = 0;
        
        if (activeSummary.ledgers) {
            activeSummary.ledgers.forEach((l: any) => {
                const gDate = new Date(l.grant_date);
                const eDate = new Date(l.expire_date);
                
                if (eDate < today) return;
                
                const remaining = l.days_granted - l.days_used;
                if (remaining <= 0) return;
                
                if (gDate <= oneYearAgo) {
                    carryoverBalance += remaining;
                } else {
                    currentBalance += remaining;
                }
            });
        }
        
        return { carryoverBalance, currentBalance };
    }, [activeSummary]);

    const activeFormLeaveTypeName = useMemo(() => {
        const lt = leaveTypes.find(t => t.id === formLeaveTypeId);
        return lt ? lt.name : "";
    }, [leaveTypes, formLeaveTypeId]);

    const handleGrant = async () => {
        if (!isAuthenticated || !selectedUserId || !formLeaveTypeId) {
            toast.error("必要項目を入力してください");
            return;
        }
        setIsGranting(true);

        const normalizeDateStr = (val: string) => {
            if (!val) return val;
            return val.replace(/\//g, "-");
        };

        try {
            const bodyData: any = {
                user_id: selectedUserId,
                leave_type_id: formLeaveTypeId,
                grant_date: normalizeDateStr(grantDate),
                days_granted: parseFloat(daysGranted)
            };

            if (customExpireDate) {
                bodyData.expire_date = normalizeDateStr(customExpireDate);
            }

            const res = await fetch(BACKEND_URL + "/api/v1/paid-leaves/ledgers/grant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                toast.success("休暇の付与が完了しました");
                setDaysGranted("10");
                setCustomExpireDate("");
                // Refresh summary
                await fetchSummary();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.detail || "付与に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsGranting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="有給管理"
                description="各メンバーへの有給休暇の付与および消化状況の管理を行います。"
                icon={CalendarCheck}
            />

            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">管理対象従業員の選択</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Label className="text-sm font-semibold">従業員:</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="従業員を選択..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedUserId && userSummary && (
                <div className="space-y-6">
                    {/* Dynamic Tabs / Toggle UI */}
                    <div className="flex flex-wrap gap-2 border-b pb-2">
                        {leaveTypes.map(t => {
                            const summaryItem = userSummary.summaries.find(s => s.leave_type.id === t.id);
                            const balance = summaryItem ? summaryItem.current_balance : 0;
                            const isActive = selectedLeaveTypeId === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedLeaveTypeId(t.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-x -mb-2 transition-all flex items-center gap-2 ${
                                        isActive
                                            ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-slate-800 shadow-sm"
                                            : "bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent"
                                    }`}
                                >
                                    <span>{t.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700' : 'bg-gray-200/60 dark:bg-slate-800 text-gray-600'}`}>
                                        {balance} 日
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left/Middle Column: Summary & History for Active Leave Type */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeSummary ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="shadow-sm">
                                            <CardHeader className="p-4">
                                                <CardDescription className="text-xs">現在の残高</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 pb-4">
                                                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    {activeSummary.current_balance} <span className="text-sm font-normal text-muted-foreground">日</span>
                                                </div>
                                                {carryoverAndCurrent && (
                                                    <div className="text-[10px] text-muted-foreground mt-1.5 flex gap-2 border-t pt-1.5">
                                                        <span>当年度: <strong className="text-gray-700 dark:text-gray-200 font-bold">{carryoverAndCurrent.currentBalance}日</strong></span>
                                                        <span>繰越: <strong className="text-gray-700 dark:text-gray-200 font-bold">{carryoverAndCurrent.carryoverBalance}日</strong></span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-sm">
                                            <CardHeader className="p-4">
                                                <CardDescription className="text-xs">累計付与数</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 pb-4">
                                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                                                    {activeSummary.total_granted} <span className="text-sm font-normal text-muted-foreground">日</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-sm">
                                            <CardHeader className="p-4">
                                                <CardDescription className="text-xs">累計消化数</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 pb-4">
                                                <div className="text-2xl font-bold text-red-500">
                                                    {activeSummary.total_used} <span className="text-sm font-normal text-muted-foreground">日</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <BadgeCheck className="h-5 w-5 text-indigo-600" />
                                                {activeSummary.leave_type.name} 付与・消化履歴
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>日付</TableHead>
                                                            <TableHead>区分</TableHead>
                                                            <TableHead>日数</TableHead>
                                                            <TableHead>備考 / 有効期限</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {activeSummary.history.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                                                                    履歴データはありません
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            activeSummary.history.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-medium">
                                                                        {(() => {
                                                                            if (!item.date) return "";
                                                                            const parts = item.date.split("-");
                                                                            if (parts.length === 3) {
                                                                                const [y, m, d] = parts;
                                                                                if (y.length === 4) return `${y}/${m}/${d}`;
                                                                                return `${d}/${y}/${m}`;
                                                                            }
                                                                            const slashParts = item.date.split("/");
                                                                            if (slashParts.length === 3) {
                                                                                const [m, d, y] = slashParts;
                                                                                if (y.length === 4) return `${y}/${m}/${d}`;
                                                                                if (m.length === 4) return `${m}/${d}/${y}`;
                                                                            }
                                                                            return item.date;
                                                                        })()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                            item.type === "消化"
                                                                                ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                                                                                : "bg-green-50 dark:bg-green-950/30 text-green-600"
                                                                        }`}>
                                                                            {item.type}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className={item.type === "消化" ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                                                        {item.type === "消化" ? "-" : "+"}{item.amount} 日
                                                                    </TableCell>
                                                                    <TableCell className="text-sm text-muted-foreground">
                                                                        {(() => {
                                                                            if (!item.description) return "";
                                                                            // Replace "有効期限: yyyy-mm-dd" with "有効期限: yyyy/mm/dd"
                                                                            return item.description.replace(
                                                                                /(\d{4})-(\d{2})-(\d{2})/,
                                                                                "$1/$2/$3"
                                                                            );
                                                                        })()}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-lg">
                                    選択した休暇タイプのデータがありません
                                </div>
                            )}
                        </div>

                        {/* Right Column: Dynamic Grant Form */}
                        <div className="space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-indigo-600" />
                                        新規休暇付与 / 調整
                                    </CardTitle>
                                    <CardDescription>
                                        従業員に任意の休暇を手動で付与または調整します。
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">付与する休暇区分</Label>
                                        <Select value={formLeaveTypeId} onValueChange={setFormLeaveTypeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="休暇区分を選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {leaveTypes.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">付与日</Label>
                                        <DateInput value={grantDate} onChange={setGrantDate} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">付与日数</Label>
                                        <Input type="number" step="0.5" value={daysGranted} onChange={e => setDaysGranted(e.target.value)} />
                                    </div>

                                    <div className="grid gap-2 border-t pt-3">
                                        <Label className="text-xs font-bold flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                            有効期限 (任意)
                                        </Label>
                                        <DateInput
                                            value={customExpireDate}
                                            onChange={setCustomExpireDate}
                                            placeholder="例: 2028/06/02"
                                        />
                                        <span className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                                            {activeFormLeaveTypeName === "代休" ? (
                                                "※空欄の場合、日本の就業規則適合に基づき「翌月末」に自動設定されます。"
                                            ) : activeFormLeaveTypeName === "有給休暇" ? (
                                                "※空欄の場合、標準規約に基づき「2年後」に自動設定されます。"
                                            ) : (
                                                "※空欄の場合、デフォルトで「2年後」に自動設定されます。"
                                            )}
                                        </span>
                                    </div>

                                    <Button onClick={handleGrant} disabled={isGranting} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                                        {isGranting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        付与・調整を実行
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {!selectedUserId && !isLoadingUsers && (
                <div className="text-center py-12 text-muted-foreground bg-indigo-50/20 dark:bg-slate-900/10 rounded-xl border border-dashed border-indigo-200/50 flex flex-col items-center justify-center gap-3">
                    <Clock className="h-10 w-10 text-indigo-400 animate-pulse" />
                    <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-300">従業員を選択してください</span>
                    <p className="text-xs text-muted-foreground">従業員を選択すると、有給や代休の残高・履歴の確認と付与フォームが表示されます。</p>
                </div>
            )}
        </div>
    );
}
