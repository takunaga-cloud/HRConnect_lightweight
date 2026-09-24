"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ProjectAnalytics {
  id: string;
  code: string;
  name: string;
  budget_hours: number;
  actual_hours: number;
  remaining_hours: number;
  usage_rate: number;
}

interface ProjectCostAnalytics {
  id: string;
  code: string;
  name: string;
  budget_hours: number;
  actual_hours: number;
  actual_cost: number;
  is_active: boolean;
}

export default function AdminAnalyticsPage() {
  const { isAuthenticated, loading } = useAuth() || {};

  // Analytics State
  const [projectStats, setProjectStats] = useState<ProjectAnalytics[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCostAnalytics[]>([]);

  const fetchProjectStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/analytics/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjectStats(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("プロジェクト分析データの取得に失敗しました");
    }
  }, [isAuthenticated]);

  const fetchProjectCosts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/analytics/project-costs`);
      if (res.ok) {
        const data = await res.json();
        setProjectCosts(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("プロジェクト人件費データの取得に失敗しました");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjectStats();
      fetchProjectCosts();
    }
  }, [isAuthenticated, fetchProjectStats, fetchProjectCosts]);

  if (loading) {
    return (
      <div className="p-4">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="工数・人件費分析レポート"
        description="プロジェクトごとの工数予算と現在の実績、および人件費コストの発生状況を可視化します。(管理者専用機能)"
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* プロジェクト分析セクション */}
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト工数予実管理</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStats} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis label={{ value: "時間(H)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar dataKey="budget_hours" fill="#8884d8" name="予算時間" />
                <Bar dataKey="actual_hours" fill="#82ca9d" name="実績時間" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* プロジェクト人件費コストセクション */}
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト別発生人件費コスト</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectCosts} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis label={{ value: "コスト(円)", angle: -90, position: "insideLeft" }} tickFormatter={(tick) => `¥${tick.toLocaleString()}`} />
                <Tooltip formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, "発生コスト"]} />
                <Legend verticalAlign="top" />
                <Bar dataKey="actual_cost" fill="#f43f5e" name="人件費コスト" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
