"use client";

import { BACKEND_URL } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Cpu, Globe, Award, Hourglass, FolderOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts";

interface SkillItem {
    name: string;
    hours: number;
    project_count: number;
    years: number;
}

interface SkillsData {
    languages: SkillItem[];
    skills: SkillItem[];
    environments: SkillItem[];
}

interface User {
    id: string;
    name: string;
    role: string;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#f43f5e"];

export default function SkillsPortfolioPage() {
    const auth = useAuth();
    const current_user = auth?.user;
    const isAuthenticated = auth?.isAuthenticated;
    const role = current_user?.role?.toLowerCase()?.trim() || "";
    const isAdminOrManager = ["admin", "manager"].includes(role);

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [usersList, setUsersList] = useState<User[]>([]);
    const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && current_user) {
            setSelectedUserId(current_user.id || "");
            if (isAdminOrManager) {
                fetchUsers();
            }
        }
    }, [isAuthenticated, current_user]);

    useEffect(() => {
        if (selectedUserId) {
            fetchSkills(selectedUserId);
        }
    }, [selectedUserId]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/users/");
            if (res.ok) {
                const data = await res.json();
                setUsersList(data);
            }
        } catch (e) {
            console.error("ユーザー一覧の取得に失敗しました", e);
        }
    };

    const fetchSkills = async (userId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(BACKEND_URL + `/api/v1/analytics/skills?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setSkillsData(data);
            } else {
                toast.error("スキルデータの取得に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="スキルポートフォリオ"
                description="日報で記録した工数実績に基づき、プログラミング言語・技術スキル・クラウド環境別の経験時間・プロジェクト件数・稼働期間を自動集計して可視化します。"
                icon={Award}
            >
                {isAdminOrManager && (
                    <div className="w-full md:w-64 bg-slate-900/60 backdrop-blur-md p-3 rounded-lg border border-indigo-500/20">
                        <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5">
                            メンバー切り替え
                        </label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white">
                                <SelectValue placeholder="メンバーを選択" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                {usersList.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </PageHeader>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <span className="text-sm text-muted-foreground font-medium animate-pulse">実績データからスキル情報を算出中...</span>
                </div>
            ) : skillsData ? (
                <div className="space-y-6">
                    {/* Skills Dashboard metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Languages Section */}
                        <Card className="border-t-4 border-t-blue-500 shadow-md bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-blue-500" /> メイン言語
                                </CardTitle>
                                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                                    {skillsData.languages.length}種類
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pt-2">
                                {skillsData.languages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">言語データが計上されていません。</p>
                                ) : (
                                    skillsData.languages.map((item, idx) => (
                                        <div key={item.name} className="space-y-1.5 p-3 rounded-lg hover:bg-slate-100/50 transition-colors">
                                            <div className="flex justify-between items-center text-sm font-semibold">
                                                <span>{item.name}</span>
                                                <span className="text-blue-600">{item.hours} 時間</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (item.hours / (skillsData.languages[0]?.hours || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {item.project_count} 件</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {item.years} 年</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Frameworks & Skills Section */}
                        <Card className="border-t-4 border-t-purple-500 shadow-md bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-purple-500" /> 技術スキル
                                </CardTitle>
                                <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                                    {skillsData.skills.length}種類
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pt-2">
                                {skillsData.skills.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">スキルデータが計上されていません。</p>
                                ) : (
                                    skillsData.skills.map((item, idx) => (
                                        <div key={item.name} className="space-y-1.5 p-3 rounded-lg hover:bg-slate-100/50 transition-colors">
                                            <div className="flex justify-between items-center text-sm font-semibold">
                                                <span>{item.name}</span>
                                                <span className="text-purple-600">{item.hours} 時間</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (item.hours / (skillsData.skills[0]?.hours || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {item.project_count} 件</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {item.years} 年</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Environments Section */}
                        <Card className="border-t-4 border-t-emerald-500 shadow-md bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-emerald-500" /> 開発環境・インフラ
                                </CardTitle>
                                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                    {skillsData.environments.length}種類
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pt-2">
                                {skillsData.environments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">環境データが計上されていません。</p>
                                ) : (
                                    skillsData.environments.map((item, idx) => (
                                        <div key={item.name} className="space-y-1.5 p-3 rounded-lg hover:bg-slate-100/50 transition-colors">
                                            <div className="flex justify-between items-center text-sm font-semibold">
                                                <span>{item.name}</span>
                                                <span className="text-emerald-600">{item.hours} 時間</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (item.hours / (skillsData.environments[0]?.hours || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {item.project_count} 件</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {item.years} 年</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart Visualization Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart for Overview */}
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">技術ポートフォリオ分布 (時間数ベース)</CardTitle>
                                <CardDescription>主要な言語とスキルの稼働実績バランス</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center p-4">
                                {skillsData.languages.length === 0 && skillsData.skills.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-10">データがありません</p>
                                ) : (
                                    <div className="w-full h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                ...skillsData.languages.slice(0, 4),
                                                ...skillsData.skills.slice(0, 4)
                                            ]}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                                                <Radar name="経験時間 (H)" dataKey="hours" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bar chart for environments or languages */}
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">環境・インフラ経験</CardTitle>
                                <CardDescription>インフラ環境に費やした稼働時間</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                {skillsData.environments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-10">環境データがありません</p>
                                ) : (
                                    <div className="w-full h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={skillsData.environments}
                                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                            >
                                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                                                <YAxis label={{ value: "時間 (H)", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                                                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                                                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]}>
                                                    {skillsData.environments.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="text-center p-12 text-muted-foreground">
                    データをロードできませんでした。
                </div>
            )}
        </div>
    );
}
