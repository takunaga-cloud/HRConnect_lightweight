"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { useShiftManagement } from "@/hooks/useShiftManagement"
import { Shift } from "@/types"
import { useShiftMutations } from "@/hooks/useShiftMutations"
import { TemplateManager } from "@/components/admin/shifts/TemplateManager"
import { ShiftDialog } from "@/components/admin/shifts/ShiftDialog"
import { HolidayGenerator } from "@/components/admin/shifts/HolidayGenerator"
import { ShiftGenerator } from "@/components/admin/shifts/ShiftGenerator"
import { ShiftFilters } from "@/components/admin/shifts/ShiftFilters"
import { BACKEND_URL } from "@/lib/constants"
import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminShiftsPage() {
  const { isAuthenticated } = useAuth() || {}
  const {
    shifts, users, templates, currentDate, setCurrentDate,
    fetchShifts, fetchTemplates
  } = useShiftManagement()

  // Mutations Hook

  const {
    handleDeleteShift,
    isBatchDeleteOpen, setIsBatchDeleteOpen,
    batchDeleteTargetIds, setBatchDeleteTargetIds,
    batchDeleteStart, setBatchDeleteStart,
    batchDeleteEnd, setBatchDeleteEnd,
    handleBatchDelete,
    fileInputRef, handleFileUpload
  } = useShiftMutations(isAuthenticated || false, fetchShifts)

  // --- UI Local State ---
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined)

  // Filters
  const [filterUser, setFilterUser] = useState("ALL")
  const [filterShiftType, setFilterShiftType] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")

  const filteredShifts = shifts.filter(s => {
    const matchUser = filterUser === "ALL" || s.user_id === filterUser;
    const matchType = filterShiftType === "ALL" || s.shift_type === filterShiftType;
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    return matchUser && matchType && matchStatus;
  });

  // --- Handlers ---
  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift)
    setIsShiftDialogOpen(true)
  }

  const handleOpenNewShift = () => {
    setEditingShift(undefined)
    setIsShiftDialogOpen(true)
  }

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id || u.cognito_sub === id);
    return user ? `${user.user_id || ''} ${user.name}` : id;
  }

  const handleApproveShift = async (shiftId: string) => {
    if (!isAuthenticated) return;
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/api/v1/shifts/${shiftId}/approve`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (res.ok) {
            fetchShifts();
        } else {
            alert("承認に失敗しました。");
        }
    } catch (err) {
        console.error(err);
        alert("エラーが発生しました。");
    }
  }

  const handleBulkApprove = async () => {
    if (!isAuthenticated) return;
    const pendingShifts = filteredShifts.filter(s => s.status === 'Requested');
    if (pendingShifts.length === 0) {
        alert("承認待ちの希望シフトはありません。");
        return;
    }
    if (!confirm(`${pendingShifts.length} 件の希望シフトを一括で確定しますか？`)) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/api/v1/shifts/bulk-approve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ shift_ids: pendingShifts.map(s => s.id) })
        });
        if (res.ok) {
            alert("一括承認が完了しました。");
            fetchShifts();
        } else {
            alert("一括承認に失敗しました。");
        }
    } catch (err) {
        console.error(err);
        alert("エラーが発生しました。");
    }
  }

  const hasPendingRequests = filteredShifts.some(s => s.status === 'Requested');

  // --- Render ---
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="シフト管理"
        description="メンバーごとのシフト勤務パターンの作成およびアサイン管理を行います。"
        icon={CalendarDays}
      >
        <div className="flex flex-wrap gap-2 w-full lg:w-auto bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-indigo-500/20 text-white items-center">
          <TemplateManager templates={templates} onUpdate={fetchTemplates} />
          {hasPendingRequests && (
            <Button onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm px-3 py-1 font-medium shadow">希望を一括確定</Button>
          )}
          <Button onClick={handleOpenNewShift} className="text-xs md:text-sm px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow">シフト登録</Button>
          <ShiftGenerator users={users} templates={templates} onUpdate={fetchShifts} />
          <HolidayGenerator users={users} onUpdate={fetchShifts} />
          <Button variant="outline" onClick={() => setIsBatchDeleteOpen(true)} className="text-xs md:text-sm px-3 py-1 bg-red-950/60 border-red-800/80 text-red-300 hover:bg-red-900/80 hover:text-red-100">一括削除</Button>
          <div className="relative">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="text-xs md:text-sm px-3 py-1 bg-slate-950/80 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white">CSVインポート</Button>
          </div>
        </div>
      </PageHeader>

      {isBatchDeleteOpen && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="p-4">
            <CardTitle className="text-red-700 text-sm">シフト一括削除</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2 w-full sm:w-auto">
                <Label className="text-red-700">対象</Label>
                <Select onValueChange={(val) => {
                  if (val === "ALL") setBatchDeleteTargetIds(users.map(u => u.id))
                  else setBatchDeleteTargetIds([val])
                }}>
                  <SelectTrigger className="w-full sm:w-[200px] border-red-300">
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全員</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full sm:w-auto">
                <Label className="text-red-700">期間</Label>
                <div className="flex gap-2 items-center">
                  <DateInput value={batchDeleteStart} onChange={setBatchDeleteStart} className="border-red-300 w-full sm:w-auto" />
                  <span>~</span>
                  <DateInput value={batchDeleteEnd} onChange={setBatchDeleteEnd} className="border-red-300 w-full sm:w-auto" />
                </div>
              </div>
              <Button variant="destructive" className="w-full sm:w-auto mt-2 sm:mt-0" onClick={handleBatchDelete}>実行</Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* CSV Upload Area */}
      <Card>
        <CardContent className="py-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full md:max-w-xs"
          />
          <p className="text-sm text-gray-500">
            CSVフォーマット: TargetDate, StartTime, EndTime, ShiftType, UserId, Remarks (Headerあり)
          </p>
        </CardContent>
      </Card>

      {/* Main Filter and Table Area */}
      <Card>
        <CardHeader>
          <ShiftFilters
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            users={users}
            templates={templates}
            filterUser={filterUser}
            setFilterUser={setFilterUser}
            filterShiftType={filterShiftType}
            setFilterShiftType={setFilterShiftType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filteredCount={filteredShifts.length}
          />
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>曜</TableHead>
                  <TableHead>従業員</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>備考</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.sort((a, b) => a.target_date.localeCompare(b.target_date)).map((shift) => (
                  <TableRow key={shift.id} className={shift.status === 'Requested' ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                    <TableCell>{format(parseISO(shift.target_date), "MM/dd")}</TableCell>
                    <TableCell>{format(parseISO(shift.target_date), "E", { locale: ja })}</TableCell>
                    <TableCell>{getUserName(shift.user_id)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${shift.is_holiday ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}>
                      {shift.shift_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!shift.is_holiday && shift.start_time && shift.end_time ? (
                        `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}`
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                      {shift.remarks}
                    </TableCell>
                    <TableCell>
                      {shift.status === 'Requested' ? (
                        <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800 font-semibold border border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700">希望（未確定）</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-semibold dark:bg-green-950 dark:text-green-300">確定済み</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1 items-center">
                      {shift.status === 'Requested' && (
                        <Button variant="default" size="sm" onClick={() => handleApproveShift(shift.id)} className="bg-green-600 hover:bg-green-700 text-white">確定</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEditShift(shift)}>編集</Button>
                      <Button variant="ghost" size="sm" onClick={() => shift.id && handleDeleteShift(shift.id)} className="text-red-500">削除</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredShifts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      シフトデータがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Main Editing Dialog */}
      <ShiftDialog
        isOpen={isShiftDialogOpen}
        onClose={() => setIsShiftDialogOpen(false)}
        onUpdate={fetchShifts}
        users={users}
        templates={templates}
        initialData={editingShift}
      />

    </div>
  )
}
