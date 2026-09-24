"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface User {
    id: string;
    name: string;
    role: string;
}

interface Project {
    id: string;
    code: string;
    name: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    budget_minutes: number;
    leader_id: string | null;
    leader?: User | null;
    difficulty?: string | null;
    category?: string | null;
    main_languages?: string[] | null;
    skills?: string[] | null;
    environments?: string[] | null;
}

interface TagSelectorProps {
    label: string;
    suggestions: string[];
    selected: string[];
    onChange: (tags: string[]) => void;
    placeholder: string;
}

// チップス形式のタグ選択・カスタム追加用コンポーネント
function TagSelector({ label, suggestions, selected, onChange, placeholder }: TagSelectorProps) {
    const [inputValue, setInputValue] = useState("");

    const handleAddTag = (tag: string) => {
        const cleaned = tag.trim();
        if (cleaned && !selected.includes(cleaned)) {
            onChange([...selected, cleaned]);
        }
        setInputValue("");
    };

    const handleRemoveTag = (tag: string) => {
        onChange(selected.filter(t => t !== tag));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {selected.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium border border-primary/20">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-foreground ml-1">
                            &times;
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    placeholder={selected.length === 0 ? placeholder : ""}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(inputValue);
                        }
                    }}
                    className="flex-1 min-w-[80px] bg-transparent outline-none text-sm border-none p-0 focus:ring-0 placeholder:text-muted-foreground"
                />
            </div>
            <div className="flex flex-wrap gap-1 mt-1 text-[11px] items-center">
                <span className="text-muted-foreground mr-1">候補:</span>
                {suggestions.map(sug => {
                    const isSelected = selected.includes(sug);
                    return (
                        <button
                            key={sug}
                            type="button"
                            onClick={() => isSelected ? handleRemoveTag(sug) : handleAddTag(sug)}
                            className={`px-2 py-0.5 rounded-full border transition-colors ${
                                isSelected 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent"
                            }`}
                        >
                            {sug}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const LANGUAGES_SUGGESTIONS = ["TypeScript", "JavaScript", "Python", "Go", "Java", "PHP", "Ruby", "C#", "C++", "Rust"];
const SKILLS_SUGGESTIONS = ["Next.js", "React", "FastAPI", "SQLAlchemy", "Pydantic", "Tailwind CSS", "Spring Boot", "Rails", "PostgreSQL", "SQLite", "DynamoDB", "AWS", "Docker"];
const ENVIRONMENTS_SUGGESTIONS = ["Docker", "AWS", "GCP", "Supabase", "Vercel", "GitHub Actions", "Linux"];

// 日付フォーマットのヘルパー
const formatDateStr = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "未定";
    try {
        const date = new Date(dateStr);
        return format(date, "yyyy/MM/dd");
    } catch {
        return dateStr;
    }
};

export default function AdminProjectsPage() {
    const auth = useAuth();
    const isAuthenticated = auth?.isAuthenticated;
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [candidateUsers, setCandidateUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        is_active: true,
        budget_hours: 0,
        leader_id: "none",
        difficulty: "中級",
        category: "Webアプリケーション",
        main_languages: [] as string[],
        skills: [] as string[],
        environments: [] as string[]
    });

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/projects/admin");
            if (res.ok) {
                setProjects(await res.json());
            } else {
                toast.error("プロジェクト一覧の取得に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/users/");
            if (res.ok) {
                const allUsers: User[] = await res.json();
                const leaders = allUsers.filter(u =>
                    ["Admin", "Manager", "Leader"].includes(u.role)
                );
                setCandidateUsers(leaders);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
            fetchUsers();
        }
    }, [isAuthenticated]);

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setEditingId(project.id);
            setFormData({
                code: project.code,
                name: project.name,
                start_date: project.start_date,
                end_date: project.end_date || "",
                is_active: project.is_active,
                budget_hours: project.budget_minutes ? project.budget_minutes / 60 : 0,
                leader_id: project.leader_id || "none",
                difficulty: project.difficulty || "中級",
                category: project.category || "Webアプリケーション",
                main_languages: project.main_languages || [],
                skills: project.skills || [],
                environments: project.environments || []
            });
        } else {
            setEditingId(null);
            setFormData({
                code: "",
                name: "",
                start_date: format(new Date(), "yyyy-MM-dd"),
                end_date: "",
                is_active: true,
                budget_hours: 0,
                leader_id: "none",
                difficulty: "中級",
                category: "Webアプリケーション",
                main_languages: [],
                skills: [],
                environments: []
            });
        }
        setIsDialogOpen(true);
    };

    const calculateSubmit = async () => {
        setIsSubmitting(true);

        const payload = {
            ...formData,
            end_date: formData.end_date === "" ? null : formData.end_date,
            budget_minutes: Math.round(formData.budget_hours * 60),
            leader_id: formData.leader_id === "none" ? null : formData.leader_id,
        };
        // @ts-ignore
        delete payload.budget_hours;

        try {
            let res;
            if (editingId) {
                res = await fetch(BACKEND_URL + "/api/v1/projects/" + editingId, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(BACKEND_URL + "/api/v1/projects/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                toast.success(editingId ? "プロジェクトを更新しました" : "プロジェクトを作成しました");
                setIsDialogOpen(false);
                fetchProjects();
            } else {
                const err = await res.json();
                toast.error(err.detail || "保存に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？\n紐付くデータがある場合、削除に失敗する可能性があります。")) return;

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/projects/" + id, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("削除しました");
                fetchProjects();
            } else {
                toast.error("削除に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="プロジェクト管理"
                description="業務日報で工数入力の対象となるプロジェクトと予算、技術要件等を管理します。"
                icon={Briefcase}
            >
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> 新規プロジェクト
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>プロジェクト一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">コード</TableHead>
                                        <TableHead className="min-w-[200px]">プロジェクト名 / スキルセット</TableHead>
                                        <TableHead className="w-[150px]">カテゴリ / 難易度</TableHead>
                                        <TableHead className="w-[180px]">期間</TableHead>
                                        <TableHead className="w-[120px]">リーダー</TableHead>
                                        <TableHead className="w-[100px]">予算(H)</TableHead>
                                        <TableHead className="w-[100px]">ステータス</TableHead>
                                        <TableHead className="text-right w-[100px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                プロジェクトがありません。
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        projects.map((project) => (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-mono text-sm align-top pt-4">{project.code}</TableCell>
                                                <TableCell className="align-top pt-4">
                                                    <div className="space-y-2">
                                                        <div className="font-bold text-base">{project.name}</div>
                                                        {/* タグ表示 */}
                                                        <div className="flex flex-wrap gap-1">
                                                            {project.main_languages?.map(lang => (
                                                                <Badge key={lang} variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200/60 text-[10px] px-2 py-0">
                                                                    {lang}
                                                                </Badge>
                                                            ))}
                                                            {project.skills?.map(skill => (
                                                                <Badge key={skill} variant="outline" className="bg-purple-50/50 text-purple-700 border-purple-200/60 text-[10px] px-2 py-0">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {project.environments?.map(env => (
                                                                <Badge key={env} variant="outline" className="bg-green-50/50 text-green-700 border-green-200/60 text-[10px] px-2 py-0">
                                                                    {env}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top pt-4">
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-muted-foreground font-medium">
                                                            {project.category || "未分類"}
                                                        </div>
                                                        {project.difficulty && (
                                                            <Badge className={
                                                                project.difficulty === "上級" ? "bg-red-500 hover:bg-red-600" :
                                                                project.difficulty === "中級" ? "bg-amber-500 hover:bg-amber-600" :
                                                                "bg-emerald-500 hover:bg-emerald-600"
                                                            }>
                                                                {project.difficulty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm align-top pt-4 text-muted-foreground whitespace-nowrap">
                                                    {formatDateStr(project.start_date)} 〜 {formatDateStr(project.end_date)}
                                                </TableCell>
                                                <TableCell className="align-top pt-4">
                                                    {project.leader ? (
                                                        <span className="text-sm font-medium">{project.leader.name}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">未設定</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top pt-4 font-mono text-sm">
                                                    {project.budget_minutes ? (project.budget_minutes / 60).toFixed(1) : "-"}
                                                </TableCell>
                                                <TableCell className="align-top pt-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${project.is_active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        {project.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1 align-top pt-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(project)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                        onClick={() => handleDelete(project.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[90vw] lg:max-w-7xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="pb-2 border-b">
                        <DialogTitle>{editingId ? "プロジェクト編集" : "新規プロジェクト"}</DialogTitle>
                        <DialogDescription>
                            日報入力で使用するプロジェクト情報を管理します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                        {/* カラム1: 基本情報 */}
                        <div className="space-y-4 pr-0 lg:pr-4 lg:border-r">
                            <h3 className="font-bold text-sm text-foreground mb-2">基本情報</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="code" className="font-semibold text-xs text-muted-foreground">
                                        コード
                                    </Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="PROJ-001"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="font-semibold text-xs text-muted-foreground">
                                        名称
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="〇〇開発案件"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="start_date" className="font-semibold text-xs text-muted-foreground">
                                        開始日
                                    </Label>
                                    <DateInput
                                        id="start_date"
                                        value={formData.start_date}
                                        onChange={(val) => setFormData({ ...formData, start_date: val })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="end_date" className="font-semibold text-xs text-muted-foreground">
                                        終了日
                                    </Label>
                                    <DateInput
                                        id="end_date"
                                        value={formData.end_date}
                                        onChange={(val) => setFormData({ ...formData, end_date: val })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="leader" className="font-semibold text-xs text-muted-foreground">
                                        リーダー
                                    </Label>
                                    <Select
                                        value={formData.leader_id}
                                        onValueChange={(val) => setFormData({ ...formData, leader_id: val })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="リーダーを選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">未設定</SelectItem>
                                            {candidateUsers.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="category" className="font-semibold text-xs text-muted-foreground">
                                        カテゴリ
                                    </Label>
                                    <Select
                                        value={formData.category || "Webアプリケーション"}
                                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Webアプリケーション">Webアプリケーション</SelectItem>
                                            <SelectItem value="モバイルアプリ">モバイルアプリ</SelectItem>
                                            <SelectItem value="インフラ/クラウド">インフラ/クラウド</SelectItem>
                                            <SelectItem value="AI/データ分析">AI/データ分析</SelectItem>
                                            <SelectItem value="その他">その他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="difficulty" className="font-semibold text-xs text-muted-foreground">
                                        難易度
                                    </Label>
                                    <Select
                                        value={formData.difficulty || "中級"}
                                        onValueChange={(val) => setFormData({ ...formData, difficulty: val })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="初級">初級 (難易度 1)</SelectItem>
                                            <SelectItem value="中級">中級 (難易度 2)</SelectItem>
                                            <SelectItem value="上級">上級 (難易度 3)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="budget_hours" className="font-semibold text-xs text-muted-foreground">
                                        予算(H)
                                    </Label>
                                    <Input
                                        id="budget_hours"
                                        type="number"
                                        value={formData.budget_hours}
                                        onChange={(e) => setFormData({ ...formData, budget_hours: parseFloat(e.target.value) || 0 })}
                                        placeholder="100"
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active" className="font-normal text-muted-foreground text-sm">
                                    有効にする
                                </Label>
                            </div>
                        </div>

                        {/* カラム2: 言語と環境 */}
                        <div className="space-y-4 pr-0 lg:pr-4 lg:border-r">
                            <div>
                                <h3 className="font-bold text-sm text-foreground mb-2">言語</h3>
                                <TagSelector
                                    label="言語"
                                    suggestions={LANGUAGES_SUGGESTIONS}
                                    selected={formData.main_languages}
                                    onChange={(tags) => setFormData({ ...formData, main_languages: tags })}
                                    placeholder="例: TypeScript, Python"
                                />
                            </div>
                            <div className="pt-2">
                                <h3 className="font-bold text-sm text-foreground mb-2">環境</h3>
                                <TagSelector
                                    label="環境"
                                    suggestions={ENVIRONMENTS_SUGGESTIONS}
                                    selected={formData.environments}
                                    onChange={(tags) => setFormData({ ...formData, environments: tags })}
                                    placeholder="例: Docker, AWS"
                                />
                            </div>
                        </div>

                        {/* カラム3: スキル */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-sm text-foreground mb-2">スキル</h3>
                                <TagSelector
                                    label="スキル"
                                    suggestions={SKILLS_SUGGESTIONS}
                                    selected={formData.skills}
                                    onChange={(tags) => setFormData({ ...formData, skills: tags })}
                                    placeholder="例: Next.js, FastAPI"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-2 border-t pt-3">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            キャンセル
                        </Button>
                        <Button onClick={calculateSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
