"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Users, AlertTriangle, Clock, FileText, ShieldAlert } from "lucide-react";
import { BACKEND_URL } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";

interface DailyAttendanceSummary {
  total_users: number;
  present_users: number;
  late_users: number;
  absent_users: number;
  alert_count: number;
  monthly_overtime_chart: { name: string; overtime_hours: number }[];
  daily_attendance_chart: { date: string; present_users: number }[];
}

export default function AdminDashboardPage() {
  const { isAuthenticated, loading } = useAuth() || {};

  const [summary, setSummary] = useState<DailyAttendanceSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);

  const fetchDailySummary = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingData(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/dashboard/summary?target_date=${currentDate}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "日別勤怠サマリーの取得に失敗しました。");
      }

      const data = await response.json();
      setSummary(data);

      const appsRes = await fetch(`${BACKEND_URL}/api/v1/applications/`);
      if (appsRes.ok) {
        const apps = await appsRes.json();
        const pendingCount = apps.filter((a: any) => a.status === "Pending").length;
        setPendingApprovals(pendingCount);
      } else {
        setPendingApprovals(0);
      }

    } catch (err: any) {
      toast.error(err.message || "日別勤怠サマリーの取得中にエラーが発生しました。");
      console.error("Fetch daily summary error:", err);
      setSummary(null);
      setPendingApprovals(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, currentDate]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchDailySummary();
    }
  }, [loading, isAuthenticated, fetchDailySummary]);

  if (loading || isLoadingData) {
    return (
      <div className="p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-1/4 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
            <div className="lg:col-span-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="ダッシュボード"
        description={`本日: ${format(new Date(), "yyyy年MM月dd日")} | 全社的な勤怠エラー、未承認の申請状況、稼働率などの重要アラートを管理・監視します。`}
        icon={ShieldAlert}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 重要な数字カード */}
          <Card className="col-span-1 bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">全従業員数</CardTitle>
              <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary?.total_users ?? "-"}</div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">出勤済み</CardTitle>
              <Clock className="h-4 w-4 text-green-700 dark:text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{summary?.present_users ?? "-"}</div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">遅刻者</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{summary?.late_users ?? "-"}</div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">未出勤</CardTitle>
              <Users className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{summary?.absent_users ?? "-"}</div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">要承認申請件数</CardTitle>
              <FileText className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{pendingApprovals ?? "-"}</div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">アラート対象者</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{summary?.alert_count ?? "-"}</div>
            </CardContent>
          </Card>

          {/* グラフセクション */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>今月の総残業時間の推移</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary?.monthly_overtime_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: "時間", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overtime_hours" stroke="#8884d8" activeDot={{ r: 8 }} name="残業時間" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>日別の出勤人数</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.daily_attendance_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} label={{ value: "人数", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present_users" fill="#82ca9d" name="出勤人数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
