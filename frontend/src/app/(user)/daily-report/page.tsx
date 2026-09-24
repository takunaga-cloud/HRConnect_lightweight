"use client"

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Save, Loader2, LayoutGrid, Table as TableIcon, FileText } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BACKEND_URL } from "@/lib/constants";
import { UI_TEXT } from "@/lib/ui_text";

interface WorkLog {
  project_id: string;
  task_category_id: string;
  minutes: number | "";
  comment: string | null;
  status: string; // "完了" or ""
  remark: string; // 50 chars max
  log_date?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

interface TaskCategory {
  id: string;
  name: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

const createEmptyLog = (): WorkLog => ({
  project_id: "",
  task_category_id: "",
  minutes: "",
  comment: "",
  status: "",
  remark: ""
});



function DailyReportContent() {
  const { isAuthenticated } = useAuth() || {}
  const searchParams = useSearchParams()

  const router = useRouter()
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const fromParam = searchParams.get("from")
  const [date, setDate] = useState(initialDate)
  const [logs, setLogs] = useState<WorkLog[]>(Array(8).fill(null).map(createEmptyLog))
  const [projects, setProjects] = useState<Project[]>([])
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([])
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([])
  const [actualMinutes, setActualMinutes] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [shiftType, setShiftType] = useState<string>("")
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)
  const [viewMode, setViewMode] = useState<"card" | "sheet">("sheet")
  const [isNonWorkingDay, setIsNonWorkingDay] = useState(false)

  // 勤怠区分の変更ハンドラ
  const handleShiftTypeChange = (newType: string) => {
    setShiftType(newType);
  }

  // モバイル画面幅の場合は自動的にカード形式をデフォルトにする
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

  // 日次情報の取得
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      setFetching(true);
      try {
        const res = await fetch(`/api/v1/work-logs/daily-info/${date}`);
        if (res.ok) {
          const data = await res.json();
          setActualMinutes(data.attendance); // total_work_minutes
          // Shift type fetched separately now
          if (data.work_logs && data.work_logs.length > 0) {
            setLogs(data.work_logs.map((l: any) => ({
              project_id: l.project_id || "proj_a",
              task_category_id: l.task_category_id || "dev",
              minutes: l.minutes,
              comment: l.comment || "",
              status: l.status || "",
              remark: l.remark || ""
            })));
          } else {
            setLogs(Array(8).fill(null).map(createEmptyLog));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    const fetchSelectOptions = async () => {
      if (!isAuthenticated) return;
      try {
        const [projRes, catRes, tmplRes, shiftRes] = await Promise.all([
          fetch(`/api/v1/projects/?assigned_only=true`),
          fetch(`/api/v1/task-categories/`),
          fetch(`/api/v1/shift-templates/`),
          fetch(`/api/v1/shifts/my-daily/${date}`)
        ]);
        if (projRes.ok) {
          let projs = await projRes.json();
          // もしアサインされているプロジェクトが0件の場合、すべてのプロジェクトをフェッチするフォールバック
          if (projs.length === 0) {
            try {
              const allProjRes = await fetch(`/api/v1/projects/`);
              if (allProjRes.ok) {
                projs = await allProjRes.json();
              }
            } catch (err) {
              console.error("Failed to fetch all fallback projects", err);
            }
          }
          setProjects(projs);
          // デフォルト値の設定: すでにログがあり、IDが空なら、最初のプロジェクトをセット
          setLogs(prevLogs => prevLogs.map(log => ({
            ...log,
            project_id: log.project_id || (projs.length > 0 ? projs[0].id : ""),
          })));
        }
        if (catRes.ok) {
          const cats = await catRes.json();
          setTaskCategories(cats);
          setLogs(prevLogs => prevLogs.map(log => ({
            ...log,
            task_category_id: log.task_category_id || (cats.length > 0 ? cats[0].id : ""),
          })));
        }
        if (tmplRes.ok) {
          const tmpls: ShiftTemplate[] = await tmplRes.json();
          const filtered = tmpls.filter(t => {
            const start = t.start_time.startsWith("00:00:00") || t.start_time === "00:00";
            const end = t.end_time.startsWith("00:00:00") || t.end_time === "00:00";
            return !(start && end);
          });
          setShiftTemplates(filtered);
        }
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShiftType(shiftData.shift_type || "");
          const types = ["PaidLeave", "公休", "全休", "有給", "有休"];
          if (types.includes(shiftData.shift_type)) {
            setIsNonWorkingDay(true);
            setMessage({ text: UI_TEXT.DAILY_REPORT.NON_WORKING_DAY, type: "error" });
          } else {
            setIsNonWorkingDay(false);
            setMessage(null);
          }
        } else if (shiftRes.status === 404) {
          setShiftType("");
          setIsNonWorkingDay(false);
          setMessage(null);
        }
      } catch (e) {
        console.error("Failed to fetch options", e);
      }
    };
    fetchData();
    fetchSelectOptions();
  }, [isAuthenticated, date]);

  const addLog = () => {
    setLogs([...logs, createEmptyLog()])
  }

  const removeLog = (index: number) => {
    setLogs(logs.filter((_: WorkLog, i: number) => i !== index))
  }

  const updateLog = (index: number, field: keyof WorkLog, value: any) => {
    const newLogs = [...logs];
    newLogs[index] = { ...newLogs[index], [field]: value };
    setLogs(newLogs);
  }

  /* 
   * 勤怠区分の変更ハンドラ
   * APIコールは行わず、状態のみ更新する。保存ボタン押下時に一括保存する。
   */
  // Helper to format YYYY/MM/DD to YYYY-MM-DD
  const normalizeDateStr = (val: any) => {
    if (typeof val === "string" && val.includes("/")) {
      return val.replace(/\//g, "-");
    }
    return val;
  };

  // Helper to format YYYY-MM-DD to YYYY/MM/DD
  const formatToSlash = (val: any) => {
    if (typeof val === "string" && val.includes("-")) {
      return val.replace(/-/g, "/");
    }
    return val;
  };

  const formattedDisplayDate = formatToSlash(date);

  const handleDateChange = (newDisplayVal: string) => {
    // 画面側の表示ステートはスラッシュ付きを許容し、必要に応じてハイフン形式に直してAPIとやり取りする
    const normalized = normalizeDateStr(newDisplayVal);
    setDate(normalized);
  };

  const totalMinutes = logs.reduce((sum: number, log: WorkLog) => sum + Number(log.minutes), 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const actualHours = actualMinutes ? (actualMinutes / 60).toFixed(1) : "0.0";

  const handleSave = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setMessage(null);

    const apiDate = normalizeDateStr(date);

    // 時間（minutes）が入力されており、かつ 0 より大きいもののみを有効なログとして扱う
    const activeLogs = logs.filter(l => l.minutes !== "" && Number(l.minutes) > 0);

    if (activeLogs.length === 0) {
      setMessage({ text: UI_TEXT.DAILY_REPORT.NO_Save_DATA, type: "error" });
      setLoading(false);
      return;
    }

    const invalidLogs = activeLogs.filter(l => !l.project_id || !l.task_category_id);
    if (invalidLogs.length > 0) {
      setMessage({ text: UI_TEXT.DAILY_REPORT.PROJECT_TASK_REQUIRED, type: "error" });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        work_logs: activeLogs.map((l: WorkLog) => ({
          project_id: l.project_id,
          task_category_id: l.task_category_id,
          minutes: Number(l.minutes) || 0,
          comment: l.comment,
          log_date: apiDate
        }))
      };

      const res = await fetch(`/api/v1/work-logs/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      // Shift Type Update
      const shiftRes = await fetch(`/api/v1/shifts/my-daily/${apiDate}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shift_type: shiftType })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save work logs");
      }
      if (!shiftRes.ok) {
        const errData = await shiftRes.json();
        throw new Error(errData.detail || "Failed to save shift type");
      }
      setMessage({ text: UI_TEXT.TOAST.SAVE_SUCCESS, type: "success" });
      if (fromParam === "monthly") {
        setTimeout(() => router.back(), 500);
      }
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
      console.error(e)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="日報登録"
        description="本日の業務内容と各プロジェクトに対する工数実績を記録します。"
        icon={FileText}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="mt-2 flex items-center gap-2">
            <Label htmlFor="report-date">日付:</Label>
            <div className="w-44">
              <DateInput
                id="report-date"
                required
                value={formattedDisplayDate}
                onChange={handleDateChange}
              />
            </div>
            <Label htmlFor="shift-type" className="ml-4">勤怠区分:</Label>
            <Select value={shiftType} onValueChange={handleShiftTypeChange} disabled={fetching}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="区分" />
              </SelectTrigger>
              <SelectContent>
                {shiftTemplates.map(t => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
                {/* Fallback for current value if not in templates */}
                {shiftType && !shiftTemplates.find(t => t.name === shiftType) && (
                  <SelectItem value={shiftType}>{shiftType}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">入力工数: {totalHours} 時間</div>
          <div className="text-sm text-muted-foreground">実労働時間: {actualHours} 時間</div>
          {actualMinutes !== null && Math.abs(totalMinutes - actualMinutes) > 15 && (
            <div className="text-xs text-red-500 font-medium">{UI_TEXT.DAILY_REPORT.HOURS_DISCREPANCY}</div>
          )}
        </div>
      </div>

      <div className="hidden md:flex justify-start mb-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "card" | "sheet")} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> カード形式
            </TabsTrigger>
            <TabsTrigger value="sheet" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" /> シート形式
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "card" ? (
        <div className="space-y-4">
          {logs.map((log: WorkLog, index: number) => (
            <Card key={index}>
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4 space-y-2">
                  <Label>プロジェクト</Label>
                  <Select value={log.project_id} onValueChange={(v: string) => updateLog(index, 'project_id', v)}>
                    <SelectTrigger disabled={isNonWorkingDay}>
                      <SelectValue placeholder="プロジェクトを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/6 space-y-2">
                  <Label>時間(分)</Label>
                  <Input
                    type="number"
                    value={log.minutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'minutes', Number(e.target.value))}
                    disabled={isNonWorkingDay}
                  />
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <Label>タスクカテゴリ</Label>
                  <Select value={log.task_category_id} onValueChange={(v: string) => updateLog(index, 'task_category_id', v)}>
                    <SelectTrigger disabled={isNonWorkingDay}>
                      <SelectValue placeholder="カテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <Label>コメント</Label>
                  <Input
                    placeholder="詳細..."
                    value={log.comment || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'comment', e.target.value)}
                    disabled={isNonWorkingDay}
                  />
                </div>
                <div className="w-full md:w-1/6 space-y-2">
                  <Label>ステータス</Label>
                  <Select value={log.status} onValueChange={(v: string) => updateLog(index, 'status', v)}>
                    <SelectTrigger disabled={isNonWorkingDay}>
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">なし</SelectItem>
                      <SelectItem value="完了">完了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                  <Label>備考</Label>
                  <Input
                    placeholder="50文字以内"
                    value={log.remark || ""}
                    maxLength={50}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'remark', e.target.value)}
                    disabled={isNonWorkingDay}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeLog(index)} disabled={isNonWorkingDay}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">プロジェクト</TableHead>
                <TableHead className="w-[80px]">時間(分)</TableHead>
                <TableHead className="w-[150px]">カテゴリ</TableHead>
                <TableHead>コメント</TableHead>
                <TableHead className="w-[100px]">状態</TableHead>
                <TableHead className="w-[150px]">備考</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: WorkLog, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2">
                    <Select value={log.project_id} onValueChange={(v: string) => updateLog(index, 'project_id', v)}>
                      <SelectTrigger className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none" disabled={isNonWorkingDay}>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      value={log.minutes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'minutes', Number(e.target.value))}
                      className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none text-right"
                      disabled={isNonWorkingDay}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select value={log.task_category_id} onValueChange={(v: string) => updateLog(index, 'task_category_id', v)}>
                      <SelectTrigger className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none" disabled={isNonWorkingDay}>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      value={log.comment || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'comment', e.target.value)}
                      placeholder="詳細..."
                      className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none"
                      disabled={isNonWorkingDay}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select value={log.status} onValueChange={(v: string) => updateLog(index, 'status', v)}>
                      <SelectTrigger className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none text-xs" disabled={isNonWorkingDay}>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_empty">なし</SelectItem>
                        <SelectItem value="完了">完了</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      value={log.remark || ""}
                      maxLength={50}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLog(index, 'remark', e.target.value)}
                      placeholder="備考..."
                      className="border-none bg-transparent hover:bg-slate-100 h-8 shadow-none"
                      disabled={isNonWorkingDay}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLog(index)} disabled={isNonWorkingDay}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button onClick={addLog} variant="outline" className="w-full dashed border-2" disabled={isNonWorkingDay || fetching}>
        <Plus className="mr-2 h-4 w-4" /> 作業ログを追加
      </Button>

      <div className="flex flex-col items-end gap-2">
        {message && (
          <div className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        {fromParam === "monthly" && (
          <Button variant="outline" size="lg" onClick={() => router.back()} disabled={loading}>
            キャンセル
          </Button>
        )}
        <Button size="lg" onClick={handleSave} disabled={loading || isNonWorkingDay}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : <><Save className="mr-2 h-4 w-4" /> {UI_TEXT.DAILY_REPORT.SAVE_BUTTON}</>}


        </Button>
      </div>
    </div>
  )
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DailyReportContent />
    </Suspense>
  )
}
