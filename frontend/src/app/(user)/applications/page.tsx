"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"
import { Loader2, Send } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants"
import { PageHeader } from "@/components/layout/page-header"

interface Application {
  id: string;
  type: string;
  status: string;
  created_at: string;
  input_data: any; // 表示用にanyを使用
  approver?: {
    name: string;
  };
}

interface ApplicationTemplateItemConfig {
  name: string;
  type: "text" | "date" | "time" | "select" | "money";
  options?: string[];
  required: boolean;
  datasource_type?: "manual" | "master";
  datasource_key?: string;
  target_field?: string;
}

interface ApplicationTemplate {
  id: string;
  name: string;
  schema_definition: ApplicationTemplateItemConfig[];
}



export default function ApplicationPage() {
  const { isAuthenticated, user } = useAuth() as any || {}
  const [type, setType] = useState("") // Initialize empty
  const [loading, setLoading] = useState(false)
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)

  // フォームフィールド
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [leaveType, setLeaveType] = useState("FullDay")
  const [targetDate, setTargetDate] = useState("")
  const [hours, setHours] = useState("")
  const [reason, setReason] = useState("")

  // Dynamic Inputs State
  const [dynamicInputData, setDynamicInputData] = useState<{ [key: string]: any }>({});

  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [masterData, setMasterData] = useState<Record<string, any[]>>({}); // Cache for master data
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([])
  const [leaveSummary, setLeaveSummary] = useState<any>(null)

  const currentTemplate = templates.find(t => t.id === type || t.name === type);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // レガシーフォーム用の半休同期ロジック
  useEffect(() => {
    const isHalfDay = leaveType === "HalfDayMorning" || leaveType === "HalfDayAfternoon" || leaveType === "午前休" || leaveType === "午後休" || leaveType === "午前半休" || leaveType === "午後半休";
    if (isHalfDay && startDate) {
      setEndDate(startDate);
    }
  }, [startDate, leaveType]);


  const fetchTemplates = async () => {
    if (!isAuthenticated) return;
    setIsTemplatesLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/application-templates/`);
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch templates", e);
    } finally {
      setIsTemplatesLoading(false);
    }
  }

  const fetchApplications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/applications/my-applications`);
      if (res.ok) {
        const data = await res.json();
        setMyApplications(data);
      }
    } catch (e) {
      console.error("Failed to fetch applications", e);
    }
  }

  const fetchLeaveSummary = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/paid-leaves/ledgers/user/${user.id}`);
      if (res.ok) {
        setLeaveSummary(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch leave summary", e);
    }
  }

  const getPaidLeaveBreakdown = (s: any) => {
    if (s.leave_type.name !== "有給休暇" || !s.ledgers) return null;
    
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    let carryover = 0;
    let current = 0;
    
    s.ledgers.forEach((l: any) => {
      const gDate = new Date(l.grant_date);
      const eDate = new Date(l.expire_date);
      
      if (eDate < today) return;
      
      const remaining = l.days_granted - l.days_used;
      if (remaining <= 0) return;
      
      if (gDate <= oneYearAgo) {
        carryover += remaining;
      } else {
        current += remaining;
      }
    });
    
    return `(当年度: ${current}日 / 繰越: ${carryover}日)`;
  };

  useEffect(() => {
    fetchApplications();
    fetchTemplates();
    fetchLeaveSummary();
  }, [isAuthenticated, user, BACKEND_URL]);

  // Reset states when type changes
  useEffect(() => {
    setDynamicInputData({});
    // We intentionally keep other states to avoid clearing if user mis-clicks, 
    // or we could clear them. For now, just clearing dynamic data.
    setMessage(null);

    const template = templates.find(t => t.name === type);
    if (template && template.schema_definition) {
      template.schema_definition.forEach(async (item: ApplicationTemplateItemConfig) => {
        if (item.type === "select" && item.datasource_type === "master" && item.datasource_key) {
          await fetchMasterData(item.datasource_key);
        }
      });
    } else {
      setDynamicInputData({});
    }
  }, [type, templates]);

  const handleDynamicInputChange = (name: string, value: any) => {
    setDynamicInputData(prev => {
      const nextData = { ...prev, [name]: value };

      // テンプレート項目に leave_type, leave_start_date, leave_end_date がマッピングされている場合の同期ロジック
      if (currentTemplate?.schema_definition) {
        let typeFieldName = "";
        let startFieldName = "";
        let endFieldName = "";

        currentTemplate.schema_definition.forEach(item => {
          if (item.target_field === "leave_type") typeFieldName = item.name;
          if (item.target_field === "leave_start_date") startFieldName = item.name;
          if (item.target_field === "leave_end_date") endFieldName = item.name;
        });

        if (!typeFieldName) typeFieldName = "種別" in nextData ? "種別" : ("leave_type" in nextData ? "leave_type" : "");
        if (!startFieldName) startFieldName = "開始日" in nextData ? "開始日" : ("leave_start_date" in nextData ? "leave_start_date" : "");
        if (!endFieldName) endFieldName = "終了日" in nextData ? "終了日" : ("leave_end_date" in nextData ? "leave_end_date" : "");

        if (typeFieldName && startFieldName && endFieldName) {
          const leaveTypeValue = nextData[typeFieldName];
          const isHalfDay = leaveTypeValue === "HalfDayMorning" || leaveTypeValue === "HalfDayAfternoon" || leaveTypeValue === "午前休" || leaveTypeValue === "午後休" || leaveTypeValue === "午前半休" || leaveTypeValue === "午後半休";
          if (isHalfDay) {
            nextData[endFieldName] = nextData[startFieldName] || "";
          }
        }
      }

      return nextData;
    });
  };

  const getLeaveTypeValue = () => {
    if (!currentTemplate || !currentTemplate.schema_definition) return "";
    const typeField = currentTemplate.schema_definition.find(item => item.target_field === "leave_type");
    if (typeField) {
      return dynamicInputData[typeField.name] || "";
    }
    return dynamicInputData["種別"] || dynamicInputData["leave_type"] || "";
  };

  const isLeaveTypeHalfDay = () => {
    const val = getLeaveTypeValue();
    return val === "HalfDayMorning" || val === "HalfDayAfternoon" || val === "午前休" || val === "午後休" || val === "午前半休" || val === "午後半休";
  };

  const isLeaveTypeFullDay = () => {
    return !isLeaveTypeHalfDay();
  };

  const fetchMasterData = async (key: string) => {
    if (masterData[key]) return; // Already fetched

    try {
      let endpoint = "";
      switch (key) {
        case "users": endpoint = "users"; break;
        case "departments": endpoint = "departments"; break;
        case "projects": endpoint = "projects"; break;
        case "attendance_categories": endpoint = "attendance-categories"; break;
        case "leave_types": endpoint = "paid-leaves/types"; break;
        default:
          if (key.startsWith("system_definitions")) {
            const cat = key.split(":")[1];
            endpoint = cat ? `system-definitions/?category_code=${cat}` : "system-definitions/";
          } else {
            return;
          }
      }

      const res = await fetch(`${BACKEND_URL}/api/v1/${endpoint}${endpoint.includes('?') ? '' : '/'}`);

      if (res.ok) {
        const data = await res.json();
        setMasterData(prev => ({ ...prev, [key]: data }));
      }
    } catch (e) {
      console.error(`Failed to fetch master data: ${key}`, e);
    }
  };

  const getOptionsForSelect = (item: ApplicationTemplateItemConfig) => {
    if (item.datasource_type === "master" && item.datasource_key) {
      const data = masterData[item.datasource_key] || [];
      return data.map((d: any) => {
        // Adjust showing name based on master type
        if (item.datasource_key === "users") return { label: d.name, value: d.id };
        if (item.datasource_key === "departments") return { label: d.name, value: d.id };
        if (item.datasource_key === "projects") return { label: d.name, value: d.id };
        if (item.datasource_key === "attendance_categories") return { label: d.name, value: d.id };
        if (item.datasource_key === "leave_types") return { label: d.name, value: d.name };
        if (item.datasource_key?.startsWith("system_definitions")) return { label: d.name, value: d.code }; // Use code as value
        return { label: d.name || d.id, value: d.id || d.name }; // fallback
      });
    }
    return (item.options || []).map(opt => ({ label: opt, value: opt }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) return;
    setLoading(true)
    setMessage(null)

    const input_data: any = { reason };

    // Determine effective template
    const legacyTypeMapping: { [key: string]: string } = {
      "PaidLeave": "有給休暇申請",
      "Overtime": "残業申請",
      "StampCorrection": "打刻修正申請",
      "Other": "交通費申請"
    };

    const targetTemplateName = legacyTypeMapping[type] || type;
    const resolvedTemplate = currentTemplate || templates.find(t => t.name === targetTemplateName);

    if (!resolvedTemplate) {
      if (!templates.length) {
      }
      if (!resolvedTemplate && !["PaidLeave", "Overtime", "StampCorrection", "Other"].includes(type)) {
        setMessage({ text: "テンプレートが見つかりません。", type: "error" });
        setLoading(false);
        return;
      }
    }

    // Populate data based on type/template
    if (type === "PaidLeave" || resolvedTemplate?.name === "有給休暇申請") {
      input_data.leave_start_date = startDate;
      input_data.leave_end_date = endDate;
      input_data.leave_type = leaveType;
    } else if (type === "Overtime" || resolvedTemplate?.name === "残業申請") {
      input_data.target_date = targetDate;
      input_data.hours = hours;
    }

    // Merge dynamic data and apply field mapping
    Object.assign(input_data, dynamicInputData);

    if (resolvedTemplate && resolvedTemplate.schema_definition) {
      resolvedTemplate.schema_definition.forEach(item => {
        if (item.target_field && item.target_field !== "none") {
          const value = dynamicInputData[item.name];
          if (value !== undefined && value !== "") {
            // General mapping for all target fields
            input_data[item.target_field] = value;

            // Sync legacy state if needed
            if (item.target_field === "reason") {
              setReason(value);
            }
          }
        }
      });
    }

    // Helper to format YYYY/MM/DD to YYYY-MM-DD
    const normalizeDateStr = (val: any) => {
      if (typeof val === "string" && val.includes("/")) {
        return val.replace(/\//g, "-");
      }
      return val;
    };

    // Normalize all dates in input_data to YYYY-MM-DD before sending
    for (const key in input_data) {
      input_data[key] = normalizeDateStr(input_data[key]);
    }

    // 全日休暇（半休以外）の際、開始日＞終了日の申請はエラーとする
    const currentLeaveType = input_data.leave_type || leaveType;
    const isHalfDay = currentLeaveType === "HalfDayMorning" || currentLeaveType === "HalfDayAfternoon" || currentLeaveType === "午前休" || currentLeaveType === "午後休" || currentLeaveType === "午前半休" || currentLeaveType === "午後半休";
    if (!isHalfDay && input_data.leave_start_date && input_data.leave_end_date) {
      const start = new Date(input_data.leave_start_date);
      const end = new Date(input_data.leave_end_date);
      if (start > end) {
        setMessage({ text: "全日休暇の際、開始日＞終了日の申請はできません。", type: "error" });
        setLoading(false);
        return;
      }
    }

    // Validate if the selected date(s) include "公休" (Public Holiday)
    const checkDates: string[] = [];
    if (input_data.leave_start_date && input_data.leave_end_date) {
      // Simple range check? iterating days
      let current = new Date(input_data.leave_start_date);
      const end = new Date(input_data.leave_end_date);
      while (current <= end) {
        checkDates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    } else if (input_data.target_date) {
      checkDates.push(input_data.target_date);
    }

    const isHolidayOrTransferApp = ["休日出勤申請", "振替休日申請", "振替休日指定"].includes(resolvedTemplate?.name || type);

    if (checkDates.length > 0 && !isHolidayOrTransferApp) {
      try {
        // Determine range for query
        const minDate = checkDates.sort()[0];
        const maxDate = checkDates.sort().reverse()[0];

        const params = new URLSearchParams({
          start_date: minDate,
          end_date: maxDate
        });
        const shiftRes = await fetch(`${BACKEND_URL}/api/v1/shifts/my-shifts?${params.toString()}`);

        if (shiftRes.ok) {
          const shifts = await shiftRes.json();
          const invalidTypes = ["PaidLeave", "公休", "全休", "有給", "有休"];
          const holidayShift = shifts.find((s: any) =>
            checkDates.includes(s.target_date) && (invalidTypes.includes(s.shift_type) || s.is_holiday)
          );

          if (holidayShift) {
            setMessage({ text: "休日のため申請できません。", type: "error" });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to validate shifts", e);
      }
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: resolvedTemplate ? resolvedTemplate.name : type,
          template_id: resolvedTemplate ? resolvedTemplate.id : undefined, // Should be required if strictly using templates
          input_data: input_data
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "申請に失敗しました。");
      }

      setMessage({ text: "申請が完了しました！", type: "success" });
      setReason("");
      setStartDate("");
      setEndDate("");
      setHours("");
      setTargetDate("");
      setDynamicInputData({});
      fetchApplications();
      fetchLeaveSummary();

    } catch (e: any) {
      setMessage({ text: e.message || "申請に失敗しました。", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!isMounted) return null;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="申請"
        description="有給休暇や打刻修正などの各種申請および申請履歴の管理を行います。"
        icon={Send}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>新規申請</CardTitle>
            <CardDescription>休暇、残業、打刻修正など</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveSummary && leaveSummary.summaries && leaveSummary.summaries.length > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-sm mb-4 border border-indigo-100 dark:border-indigo-900/50">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs">保有休暇残数:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {leaveSummary.summaries.map((s: any) => (
                    <div key={s.leave_type.id} className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded border dark:border-slate-700 font-medium flex flex-wrap items-center justify-between shadow-sm text-xs">
                      <span className="text-gray-600 dark:text-gray-300">{s.leave_type.name}:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-auto text-right">
                        {s.current_balance} 日
                        {s.leave_type.name === "有給休暇" && (
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {getPaidLeaveBreakdown(s)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">申請タイプ</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {isTemplatesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">ロード中...</span>
                      </div>
                    ) : templates.length > 0 ? (
                      templates.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-center text-muted-foreground">
                        申請区分が登録されていません
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Rendering */}
              {currentTemplate && currentTemplate.schema_definition && Array.isArray(currentTemplate.schema_definition) && currentTemplate.schema_definition.length > 0 && (
                <div className="space-y-4 border p-4 rounded-md bg-slate-50 dark:bg-slate-900/50">
                  {currentTemplate.schema_definition.map((item: ApplicationTemplateItemConfig, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <Label htmlFor={`dynamic-${idx}`}>
                        {item.name}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>

                      {item.type === "text" && (
                        <Input
                          id={`dynamic-${idx}`}
                          required={item.required}
                          value={dynamicInputData[item.name] || ""}
                          onChange={(e) => handleDynamicInputChange(item.name, e.target.value)}
                        />
                      )}

                      {item.type === "date" && (
                        <DateInput
                          id={`dynamic-${idx}`}
                          required={item.target_field === "leave_end_date" ? isLeaveTypeFullDay() : item.required}
                          value={dynamicInputData[item.name] || ""}
                          disabled={item.target_field === "leave_end_date" && isLeaveTypeHalfDay()}
                          onChange={(val) => handleDynamicInputChange(item.name, val)}
                        />
                      )}

                      {item.type === "time" && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="分"
                            id={`dynamic-${idx}`}
                            required={item.required}
                            value={dynamicInputData[item.name] || ""}
                            onChange={(e) => handleDynamicInputChange(item.name, e.target.value)}
                          />
                          <span className="text-sm text-muted-foreground">分</span>
                        </div>
                      )}

                      {item.type === "money" && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">¥</span>
                          <Input
                            type="number"
                            placeholder="0"
                            id={`dynamic-${idx}`}
                            required={item.required}
                            value={dynamicInputData[item.name] || ""}
                            onChange={(e) => handleDynamicInputChange(item.name, e.target.value)}
                          />
                        </div>
                      )}

                      {item.type === "select" && (
                        <Select
                          value={dynamicInputData[item.name] || ""}
                          onValueChange={(val) => handleDynamicInputChange(item.name, val)}
                        >
                          <SelectTrigger id={`dynamic-${idx}`}>
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {getOptionsForSelect(item).map((opt: { label: string, value: string }, optIdx: number) => (
                              <SelectItem key={optIdx} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legacy Forms for backward compatibility if template name matches special types */}
              {(type === "PaidLeave" || currentTemplate?.name === "有給休暇申請") && !currentTemplate?.schema_definition?.length && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">開始日</Label>
                      <DateInput
                        id="start"
                        required
                        value={startDate}
                        onChange={setStartDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">終了日</Label>
                      <DateInput
                        id="end"
                        required={leaveType === "FullDay"}
                        value={endDate}
                        onChange={setEndDate}
                        disabled={leaveType === "HalfDayMorning" || leaveType === "HalfDayAfternoon"}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">休暇タイプ</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FullDay">終日</SelectItem>
                        <SelectItem value="HalfDayMorning">半日 (午前)</SelectItem>
                        <SelectItem value="HalfDayAfternoon">半日 (午後)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {(type === "Overtime" || currentTemplate?.name === "残業申請") && !currentTemplate?.schema_definition?.length && (
                <div className="space-y-2">
                  <Label htmlFor="date">対象日</Label>
                  <DateInput
                    id="date"
                    required
                    value={targetDate}
                    onChange={setTargetDate}
                  />
                  <Label htmlFor="hours">予定時間</Label>
                  <Input type="number" id="hours" placeholder="2.0" required value={hours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">理由 / コメント</Label>
                <Textarea id="reason" placeholder="申請理由を入力..." value={reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} />
              </div>

              {message && (
                <div className={`p-4 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message.text}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "申請する"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>申請履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請番号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請内容</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請理由</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">承認フラグ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">承認者名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-muted-foreground">
                          申請履歴はありません。
                        </td>
                      </tr>
                    ) : (
                      myApplications.map((app, index) => (
                        <tr key={app.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                            {app.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.type === 'PaidLeave' ? '有給休暇' :
                              app.type === 'Overtime' ? '残業' :
                                app.type === 'StampCorrection' ? '打刻修正' :
                                  app.type === 'Other' ? 'その他' : app.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                            {app.input_data?.reason || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                              {app.status === 'Approved' ? '承認済み' :
                                app.status === 'Rejected' ? '却下' :
                                  app.status === 'Pending' ? '承認待ち' : app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* @ts-ignore: Application interface update pending */}
                            {app.approver?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {/* Reuse existing detail view logic or simplified version? 
                              Let's keep the existing logic but wrapped in a cell. 
                              Or just show basic info to save space since it's a table.
                              Actually, the user might want to see details. 
                              I'll rely on the existing rendering logic but simplified. */}
                            {app.input_data && (
                              <div className="text-xs space-y-1">
                                {/* Simplified Detail View for Table */}
                                {app.input_data.leave_start_date && <div>{app.input_data.leave_start_date}~</div>}
                                {app.input_data.target_date && <div>{app.input_data.target_date}</div>}
                                {app.input_data.hours && <div>{app.input_data.hours}h</div>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
