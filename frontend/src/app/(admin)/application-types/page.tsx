"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2, Plus, Trash2, Edit2, Search, FileText } from "lucide-react";

interface ApplicationTemplateItemConfig {
    name: string;
    type: "text" | "date" | "time" | "select" | "money";
    options?: string[]; // Frontend handles as string[] but backend might receive list.
    required: boolean;
    // For UI editing, we might need a string representation of options
    optionsString?: string;
    datasource_type?: "manual" | "master";
    datasource_key?: string;
    target_field?: string;
}

interface ApplicationTemplateSettings {
    reflect_attendance: boolean;
    reflect_schedule: boolean;
    reflect_dashboard: boolean;
}

interface ApplicationTemplate {
    id: string;
    name: string;
    schema_definition: ApplicationTemplateItemConfig[];
    created_at: string;
    settings?: ApplicationTemplateSettings;
}

export default function ApplicationTypesPage() {
    const { isAuthenticated } = useAuth() || {};
    const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ApplicationTemplate | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [templateItems, setTemplateItems] = useState<ApplicationTemplateItemConfig[]>([]);
    const [settings, setSettings] = useState<ApplicationTemplateSettings>({
        reflect_attendance: false,
        reflect_schedule: false,
        reflect_dashboard: false
    });

    // Filter State
    const [filterName, setFilterName] = useState("");

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(filterName.toLowerCase())
    );

    const fetchTemplates = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/application-templates/`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            } else {
                toast.error("テンプレートの取得に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [isAuthenticated]);

    const handleOpenDialog = (template?: ApplicationTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setTemplateName(template.name);
            setTemplateItems(template.schema_definition.map(item => ({
                ...item,
                optionsString: item.options?.join(",") || ""
            })));
            setSettings(template.settings || {
                reflect_attendance: false,
                reflect_schedule: false,
                reflect_dashboard: false
            });
        } else {
            setEditingTemplate(null);
            setTemplateName("");
            setTemplateItems([]);
            setSettings({
                reflect_attendance: false,
                reflect_schedule: false,
                reflect_dashboard: false
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingTemplate(null);
        setTemplateName("");
        setTemplateItems([]);
        setSettings({
            reflect_attendance: false,
            reflect_schedule: false,
            reflect_dashboard: false
        });
    };

    const handleAddItem = () => {
        if (templateItems.length >= 15) {
            toast.error("項目は最大15個までです");
            return;
        }
        setTemplateItems([
            ...templateItems,
            { name: "", type: "text", required: true, optionsString: "", datasource_type: "manual", datasource_key: "", target_field: "" }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...templateItems];
        newItems.splice(index, 1);
        setTemplateItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof ApplicationTemplateItemConfig, value: any) => {
        const newItems = [...templateItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setTemplateItems(newItems);
    };

    const handleSave = async () => {
        if (!isAuthenticated) return;
        if (!templateName) {
            toast.error("テンプレート名を入力してください");
            return;
        }
        // Validation for items
        for (const item of templateItems) {
            if (!item.name) {
                toast.error("項目名を入力してください");
                return;
            }
            if (item.type === "select") {
                if (item.datasource_type === "master") {
                    if (!item.datasource_key) {
                        toast.error("マスタ参照の場合、マスタを選択してください");
                        return;
                    }
                } else {
                    // manual or undefined (default)
                    if (!item.optionsString) {
                        toast.error("手入力プルダウンの場合、選択肢を入力してください");
                        return;
                    }
                }
            }
        }

        // Prepare data
        const schema = templateItems.map(item => ({
            name: item.name,
            type: item.type,
            required: item.required,
            options: (item.type === "select" && item.datasource_type !== "master") ? item.optionsString?.split(",").map(s => s.trim()).filter(Boolean) : undefined,
            datasource_type: item.datasource_type || "manual",
            datasource_key: item.datasource_key,
            target_field: item.target_field
        }));

        const payload = {
            name: templateName,
            schema_definition: schema,
            settings: settings
        };

        try {
            const url = editingTemplate
                ? `${BACKEND_URL}/api/v1/application-templates/${editingTemplate.id}`
                : `${BACKEND_URL}/api/v1/application-templates/`;
            const method = editingTemplate ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(editingTemplate ? "更新しました" : "作成しました");
                handleCloseDialog();
                fetchTemplates();
            } else {
                toast.error("保存に失敗しました");
            }
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました");
        }
    };

    const handleDelete = async (id: string) => {
        if (!isAuthenticated || !confirm("本当に削除しますか？")) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/application-templates/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("削除しました");
                fetchTemplates();
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
                title="申請区分管理"
                description="申請フォームのテンプレートを管理します。ユーザー申請画面の選択項目として表示されます。"
                icon={FileText}
            >
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> 新規作成
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>申請区分一覧</CardTitle>
                    <CardDescription>
                        申請フォームのテンプレートを管理します。ユーザー申請画面の選択項目として表示されます。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Label>名称検索:</Label>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="区分名で検索"
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="relative w-full overflow-auto max-h-[75vh] border rounded-md">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="sticky top-0 z-20 bg-background">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">名称</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">項目数</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[100px]">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredTemplates.map((template) => (
                                            <tr key={template.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">{template.name}</td>
                                                <td className="p-4 align-middle">{template.schema_definition.length}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(template)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTemplates.length === 0 && (
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td colSpan={3} className="p-4 align-middle text-center text-muted-foreground py-8">
                                                    条件に一致する区分がありません
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? "申請区分を編集" : "新規申請区分"}</DialogTitle>
                        <DialogDescription>
                            フォームの入力項目を設定します（最大15個）。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="templateName" className="text-right">
                                区分名（テンプレート名）
                            </Label>
                            <Input
                                id="templateName"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="col-span-3"
                                placeholder="有給休暇申請"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">反映設定</Label>
                            <div className="col-span-3 space-y-2 border p-3 rounded-md bg-white dark:bg-slate-950">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reflect_attendance"
                                        checked={settings.reflect_attendance}
                                        onCheckedChange={(c) => setSettings({ ...settings, reflect_attendance: c === true })}
                                    />
                                    <Label htmlFor="reflect_attendance" className="font-normal cursor-pointer">
                                        勤怠(打刻)に反映する
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reflect_schedule"
                                        checked={settings.reflect_schedule}
                                        onCheckedChange={(c) => setSettings({ ...settings, reflect_schedule: c === true })}
                                    />
                                    <Label htmlFor="reflect_schedule" className="font-normal cursor-pointer">
                                        シフト実績に反映する
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reflect_dashboard"
                                        checked={settings.reflect_dashboard}
                                        onCheckedChange={(c) => setSettings({ ...settings, reflect_dashboard: c === true })}
                                    />
                                    <Label htmlFor="reflect_dashboard" className="font-normal cursor-pointer">
                                        ダッシュボード集計に反映する
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>入力項目一覧</Label>
                                <Button size="sm" variant="outline" onClick={handleAddItem} disabled={templateItems.length >= 15}>
                                    <Plus className="mr-2 h-4 w-4" /> 項目追加
                                </Button>
                            </div>

                            <div className="space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                                {templateItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div className="col-span-1 flex items-center justify-center h-full">
                                            <span className="text-sm font-mono text-muted-foreground">{index + 1}</span>
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs">項目名</Label>
                                            <Input
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                                placeholder="項目名"
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs">形式</Label>
                                            <Select
                                                value={item.type}
                                                onValueChange={(val) => handleItemChange(index, "type", val)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">手入力(テキスト)</SelectItem>
                                                    <SelectItem value="date">日付</SelectItem>
                                                    <SelectItem value="time">時間(分)</SelectItem>
                                                    <SelectItem value="select">プルダウン</SelectItem>
                                                    <SelectItem value="money">金額</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-5 space-y-2">
                                            {item.type === "select" ? (
                                                <div className="space-y-2">
                                                    <Label className="text-xs">データソース</Label>
                                                    <div className="flex gap-2 mb-2">
                                                        <Button
                                                            type="button"
                                                            variant={item.datasource_type === "master" ? "outline" : "default"}
                                                            size="sm"
                                                            className="text-xs px-2 h-7"
                                                            onClick={() => handleItemChange(index, "datasource_type", "manual")}
                                                        >
                                                            手入力
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={item.datasource_type === "master" ? "default" : "outline"}
                                                            size="sm"
                                                            className="text-xs px-2 h-7"
                                                            onClick={() => handleItemChange(index, "datasource_type", "master")}
                                                        >
                                                            マスタ参照
                                                        </Button>
                                                    </div>

                                                    {item.datasource_type === "master" ? (
                                                        <>
                                                            <Label className="text-xs">参照マスタ</Label>
                                                            <Select
                                                                value={item.datasource_key?.startsWith("system_definitions") ? "system_definitions" : (item.datasource_key || "")}
                                                                onValueChange={(val) => handleItemChange(index, "datasource_key", val)}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="マスタを選択" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="users">従業員</SelectItem>
                                                                    <SelectItem value="departments">部署</SelectItem>
                                                                    <SelectItem value="projects">プロジェクト</SelectItem>
                                                                    <SelectItem value="attendance_categories">勤怠区分</SelectItem>
                                                                    <SelectItem value="system_definitions">システム定義</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {item.datasource_key?.startsWith("system_definitions") && (
                                                                <div className="mt-2 space-y-1">
                                                                    <Label className="text-[10px]">カテゴリコード (例: PAID_LEAVE_TYPE)</Label>
                                                                    <Input
                                                                        value={item.datasource_key.split(":")[1] || ""}
                                                                        onChange={(e) => handleItemChange(index, "datasource_key", `system_definitions:${e.target.value}`)}
                                                                        placeholder="カテゴリコードを入力"
                                                                        className="h-7 text-xs"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Label className="text-xs">選択肢 (カンマ区切り)</Label>
                                                            <Input
                                                                value={item.optionsString || ""}
                                                                onChange={(e) => handleItemChange(index, "optionsString", e.target.value)}
                                                                placeholder="例: 電車,バス,タクシー"
                                                                className="h-8"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-8 w-full"></div>
                                            )}
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center h-full">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="col-span-12 md:col-start-2 md:col-span-11 grid grid-cols-12 gap-4 mt-2 bg-muted/20 p-2 rounded">
                                            <div className="col-span-4">
                                                <Label className="text-xs">システム連携 (マッピング先)</Label>
                                                <Select
                                                    value={item.target_field || "none"}
                                                    onValueChange={(val) => handleItemChange(index, "target_field", val === "none" ? "" : val)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="マッピングなし" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">マッピングなし</SelectItem>
                                                        <SelectItem value="leave_start_date">休暇開始日 (leave_start_date)</SelectItem>
                                                        <SelectItem value="leave_end_date">休暇終了日 (leave_end_date)</SelectItem>
                                                        <SelectItem value="leave_type">休暇タイプ (leave_type)</SelectItem>
                                                        <SelectItem value="target_date">対象日 (target_date)</SelectItem>
                                                        <SelectItem value="hours">時間 (hours)</SelectItem>
                                                        <SelectItem value="money">金額 (money)</SelectItem>
                                                        <SelectItem value="reason">理由 (reason)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-8 flex items-center">
                                                <p className="text-[10px] text-muted-foreground">
                                                    ※ 申請データの特定フィールドに値を自動セットする場合に選択してください。
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {templateItems.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground py-4">
                                        項目がありません。「項目追加」ボタンから追加してください。
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>キャンセル</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >
        </div >
    );
}
