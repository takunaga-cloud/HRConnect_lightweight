# フロントエンド画面 (Next.js App Router / BFF) 仕様詳細書

本ドキュメントは、HRConnectにおける「フロントエンド画面 (Next.js App Router / BFF)」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 39 ファイル

---

## 掲載ファイル一覧

- [`frontend/src/app/(admin)/admin-applications/page.tsx`](#frontend-src-app-(admin)-admin-applications-page-tsx) : 画面UIコンポーネント (admin-applications 画面)
- [`frontend/src/app/(admin)/admin-attendances/page.tsx`](#frontend-src-app-(admin)-admin-attendances-page-tsx) : 画面UIコンポーネント (admin-attendances 画面)
- [`frontend/src/app/(admin)/admin-dashboard/page.tsx`](#frontend-src-app-(admin)-admin-dashboard-page-tsx) : 画面UIコンポーネント (admin-dashboard 画面)
- [`frontend/src/app/(admin)/affiliation-groups/page.tsx`](#frontend-src-app-(admin)-affiliation-groups-page-tsx) : 画面UIコンポーネント (affiliation-groups 画面)
- [`frontend/src/app/(admin)/analytics/page.tsx`](#frontend-src-app-(admin)-analytics-page-tsx) : 画面UIコンポーネント (analytics 画面)
- [`frontend/src/app/(admin)/application-types/page.tsx`](#frontend-src-app-(admin)-application-types-page-tsx) : 画面UIコンポーネント (application-types 画面)
- [`frontend/src/app/(admin)/approvals/page.tsx`](#frontend-src-app-(admin)-approvals-page-tsx) : 画面UIコンポーネント (approvals 画面)
- [`frontend/src/app/(admin)/attendance-categories/page.tsx`](#frontend-src-app-(admin)-attendance-categories-page-tsx) : 画面UIコンポーネント (attendance-categories 画面)
- [`frontend/src/app/(admin)/audit-logs/page.tsx`](#frontend-src-app-(admin)-audit-logs-page-tsx) : 画面UIコンポーネント (audit-logs 画面)
- [`frontend/src/app/(admin)/departments/page.tsx`](#frontend-src-app-(admin)-departments-page-tsx) : 画面UIコンポーネント (departments 画面)
- [`frontend/src/app/(admin)/exports/page.tsx`](#frontend-src-app-(admin)-exports-page-tsx) : 画面UIコンポーネント (exports 画面)
- [`frontend/src/app/(admin)/layout.tsx`](#frontend-src-app-(admin)-layout-tsx) : layout.tsx モジュール / 設定ファイル
- [`frontend/src/app/(admin)/monthly-shifts/page.tsx`](#frontend-src-app-(admin)-monthly-shifts-page-tsx) : 画面UIコンポーネント (monthly-shifts 画面)
- [`frontend/src/app/(admin)/paid-leaves/page.tsx`](#frontend-src-app-(admin)-paid-leaves-page-tsx) : 画面UIコンポーネント (paid-leaves 画面)
- [`frontend/src/app/(admin)/project-roles/page.tsx`](#frontend-src-app-(admin)-project-roles-page-tsx) : 画面UIコンポーネント (project-roles 画面)
- [`frontend/src/app/(admin)/projects/page.tsx`](#frontend-src-app-(admin)-projects-page-tsx) : 画面UIコンポーネント (projects 画面)
- [`frontend/src/app/(admin)/shifts/page.tsx`](#frontend-src-app-(admin)-shifts-page-tsx) : 画面UIコンポーネント (shifts 画面)
- [`frontend/src/app/(admin)/system-definitions/page.tsx`](#frontend-src-app-(admin)-system-definitions-page-tsx) : 画面UIコンポーネント (system-definitions 画面)
- [`frontend/src/app/(admin)/task-categories/page.tsx`](#frontend-src-app-(admin)-task-categories-page-tsx) : 画面UIコンポーネント (task-categories 画面)
- [`frontend/src/app/(admin)/users/page.tsx`](#frontend-src-app-(admin)-users-page-tsx) : 画面UIコンポーネント (users 画面)
- [`frontend/src/app/(auth)/login/page.tsx`](#frontend-src-app-(auth)-login-page-tsx) : 画面UIコンポーネント (login 画面)
- [`frontend/src/app/(leader)/layout.tsx`](#frontend-src-app-(leader)-layout-tsx) : layout.tsx モジュール / 設定ファイル
- [`frontend/src/app/(leader)/project-assignments/page.tsx`](#frontend-src-app-(leader)-project-assignments-page-tsx) : 画面UIコンポーネント (project-assignments 画面)
- [`frontend/src/app/(user)/applications/page.tsx`](#frontend-src-app-(user)-applications-page-tsx) : 画面UIコンポーネント (applications 画面)
- [`frontend/src/app/(user)/calendar/page.tsx`](#frontend-src-app-(user)-calendar-page-tsx) : 画面UIコンポーネント (calendar 画面)
- [`frontend/src/app/(user)/daily-report/page.tsx`](#frontend-src-app-(user)-daily-report-page-tsx) : 画面UIコンポーネント (daily-report 画面)
- [`frontend/src/app/(user)/dashboard/DashboardClient.tsx`](#frontend-src-app-(user)-dashboard-DashboardClient-tsx) : DashboardClient.tsx モジュール / 設定ファイル
- [`frontend/src/app/(user)/dashboard/page.tsx`](#frontend-src-app-(user)-dashboard-page-tsx) : 画面UIコンポーネント (dashboard 画面)
- [`frontend/src/app/(user)/layout.tsx`](#frontend-src-app-(user)-layout-tsx) : layout.tsx モジュール / 設定ファイル
- [`frontend/src/app/(user)/monthly-reports/page.tsx`](#frontend-src-app-(user)-monthly-reports-page-tsx) : 画面UIコンポーネント (monthly-reports 画面)
- [`frontend/src/app/(user)/settings/page.tsx`](#frontend-src-app-(user)-settings-page-tsx) : 画面UIコンポーネント (settings 画面)
- [`frontend/src/app/(user)/skills-portfolio/page.tsx`](#frontend-src-app-(user)-skills-portfolio-page-tsx) : 画面UIコンポーネント (skills-portfolio 画面)
- [`frontend/src/app/(user)/stamp/page.tsx`](#frontend-src-app-(user)-stamp-page-tsx) : 画面UIコンポーネント (stamp 画面)
- [`frontend/src/app/api/auth/login/route.ts`](#frontend-src-app-api-auth-login-route-ts) : Next.js Route Handler (BFF API / 認証プロキシ)
- [`frontend/src/app/api/auth/logout/route.ts`](#frontend-src-app-api-auth-logout-route-ts) : Next.js Route Handler (BFF API / 認証プロキシ)
- [`frontend/src/app/api/v1/[...path]/route.ts`](#frontend-src-app-api-v1-[---path]-route-ts) : Next.js Route Handler (BFF API / 認証プロキシ)
- [`frontend/src/app/globals.css`](#frontend-src-app-globals-css) : globals.css モジュール / 設定ファイル
- [`frontend/src/app/layout.tsx`](#frontend-src-app-layout-tsx) : layout.tsx モジュール / 設定ファイル
- [`frontend/src/app/page.tsx`](#frontend-src-app-page-tsx) : 画面UIコンポーネント (app 画面)

---

## <a id="frontend-src-app-(admin)-admin-applications-page-tsx"></a> frontend/src/app/(admin)/admin-applications/page.tsx

- **ファイル概要:** 画面UIコンポーネント (admin-applications 画面)
- **行数:** 570 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleBulkDelete`
- `renderEditForm`
- `handleSaveEdit`
- `handleSelectOne`
- `handleDelete`
- `updateFormData`
- `fetchApplications`
- `formatDetail`
- `ApplicationsPage`
- `handleBulkApprove`

### 型定義 / インターフェース
- `Application`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `@/components/ui/date-input`, `react`, `date-fns`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/button`, `@/context/AuthContext`, `@/lib/constants`, `date-fns/locale`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-admin-attendances-page-tsx"></a> frontend/src/app/(admin)/admin-attendances/page.tsx

- **ファイル概要:** 画面UIコンポーネント (admin-attendances 画面)
- **行数:** 52 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminAttendancesPage`

### 主な依存モジュール (Imports)
`@/lib/ui_text`, `@/components/admin/attendances/AttendanceTable`, `@/components/layout/page-header`, `lucide-react`, `@/hooks/useAdminAttendances`, `@/components/ui/card`, `@/components/admin/attendances/AttendanceFilter`

### コード先頭プレビュー
```text
"use client";

import { useAdminAttendances } from "@/hooks/useAdminAttendances";
import { AttendanceFilter } from "@/components/admin/attendances/AttendanceFilter";
import { AttendanceTable } from "@/components/admin/attendances/AttendanceTable";
import { Card, CardContent } from "@/components/ui/card";
import { UI_TEXT } from "@/lib/ui_text";
import { PageHeader } from "@/components/layout/page-header";
import { Clock } from "lucide-react";

export default function AdminAttendancesPage() {
    const {
        attendances,
        users,
        currentDate,
```

---

## <a id="frontend-src-app-(admin)-admin-dashboard-page-tsx"></a> frontend/src/app/(admin)/admin-dashboard/page.tsx

- **ファイル概要:** 画面UIコンポーネント (admin-dashboard 画面)
- **行数:** 222 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminDashboardPage`

### 型定義 / インターフェース
- `DailyAttendanceSummary`

### 主な依存モジュール (Imports)
`react`, `date-fns`, `@/components/ui/skeleton`, `lucide-react`, `sonner`, `recharts`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-affiliation-groups-page-tsx"></a> frontend/src/app/(admin)/affiliation-groups/page.tsx

- **ファイル概要:** 画面UIコンポーネント (affiliation-groups 画面)
- **行数:** 258 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleSubmit`
- `handleOpenDialog`
- `handleDelete`
- `fetchGroups`
- `AffiliationGroupsPage`

### 型定義 / インターフェース
- `AffiliationGroup`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/table`, `sonner`, `@/components/ui/button`, `@/components/ui/alert-dialog`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
```

---

## <a id="frontend-src-app-(admin)-analytics-page-tsx"></a> frontend/src/app/(admin)/analytics/page.tsx

- **ファイル概要:** 画面UIコンポーネント (analytics 画面)
- **行数:** 151 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminAnalyticsPage`

### 型定義 / インターフェース
- `ProjectCostAnalytics`
- `ProjectAnalytics`

### 主な依存モジュール (Imports)
`react`, `date-fns`, `lucide-react`, `@/components/ui/skeleton`, `sonner`, `@/components/ui/button`, `recharts`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-application-types-page-tsx"></a> frontend/src/app/(admin)/application-types/page.tsx

- **ファイル概要:** 画面UIコンポーネント (application-types 画面)
- **行数:** 564 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchTemplates`
- `handleItemChange`
- `handleOpenDialog`
- `handleRemoveItem`
- `ApplicationTypesPage`
- `handleDelete`
- `handleCloseDialog`
- `handleSave`
- `handleAddItem`

### 型定義 / インターフェース
- `ApplicationTemplateItemConfig`
- `ApplicationTemplate`
- `ApplicationTemplateSettings`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `react`, `@/components/ui/input`, `date-fns`, `lucide-react`, `@/components/ui/table`, `@/components/ui/checkbox`, `@/components/ui/label`, `sonner`, `@/components/ui/button`, `@/components/ui/card`

### コード先頭プレビュー
```text
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
```

---

## <a id="frontend-src-app-(admin)-approvals-page-tsx"></a> frontend/src/app/(admin)/approvals/page.tsx

- **ファイル概要:** 画面UIコンポーネント (approvals 画面)
- **行数:** 177 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminApprovalsPage`
- `handleAction`
- `fetchApplications`

### 型定義 / インターフェース
- `Application`

### 主な依存モジュール (Imports)
`react`, `lucide-react`, `sonner`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Loader2, Check, X, FileCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { toast } from "sonner"
import { BACKEND_URL } from "@/lib/constants"

interface Application {
    id: string;
    type: string;
    status: string;
```

---

## <a id="frontend-src-app-(admin)-attendance-categories-page-tsx"></a> frontend/src/app/(admin)/attendance-categories/page.tsx

- **ファイル概要:** 画面UIコンポーネント (attendance-categories 画面)
- **行数:** 351 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminAttendanceCategoriesPage`
- `fetchTemplates`
- `handleSubmit`
- `handleOpenDialog`
- `handleDelete`

### 型定義 / インターフェース
- `ShiftTemplate`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/table`, `sonner`, `@/components/ui/button`, `@/components/ui/alert-dialog`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
```

---

## <a id="frontend-src-app-(admin)-audit-logs-page-tsx"></a> frontend/src/app/(admin)/audit-logs/page.tsx

- **ファイル概要:** 画面UIコンポーネント (audit-logs 画面)
- **行数:** 144 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchLogs`
- `AuditLogsPage`

### 型定義 / インターフェース
- `AuditLog`

### 主な依存モジュール (Imports)
`@/components/ui/badge`, `react`, `date-fns`, `lucide-react`, `@/components/ui/input`, `@/components/ui/table`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Loader2, Search, FileWarning } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
```

---

## <a id="frontend-src-app-(admin)-departments-page-tsx"></a> frontend/src/app/(admin)/departments/page.tsx

- **ファイル概要:** 画面UIコンポーネント (departments 画面)
- **行数:** 328 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchDepartments`
- `handleSubmit`
- `handleOpenDialog`
- `handleDelete`
- `fetchGroups`
- `DepartmentsPage`

### 型定義 / インターフェース
- `Department`
- `AffiliationGroup`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/table`, `@/components/ui/label`, `sonner`, `@/components/ui/button`, `@/components/ui/alert-dialog`, `@/components/ui/card`, `@/context/AuthContext`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
```

---

## <a id="frontend-src-app-(admin)-exports-page-tsx"></a> frontend/src/app/(admin)/exports/page.tsx

- **ファイル概要:** 画面UIコンポーネント (exports 画面)
- **行数:** 261 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleDownload`
- `handleExecuteClosing`
- `AdminExportsPage`
- `handleReopen`
- `fetchClosingStatus`

### 型定義 / インターフェース
- `MonthlyClosing`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `react`, `date-fns`, `lucide-react`, `sonner`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
```

---

## <a id="frontend-src-app-(admin)-layout-tsx"></a> frontend/src/app/(admin)/layout.tsx

- **ファイル概要:** layout.tsx モジュール / 設定ファイル
- **行数:** 13 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminLayout`

### 主な依存モジュール (Imports)
`@/components/layout/app-layout`

### コード先頭プレビュー
```text
import SharedLayout from "@/components/layout/app-layout";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SharedLayout>
            {children}
        </SharedLayout>
    );
}
```

---

## <a id="frontend-src-app-(admin)-monthly-shifts-page-tsx"></a> frontend/src/app/(admin)/monthly-shifts/page.tsx

- **ファイル概要:** 画面UIコンポーネント (monthly-shifts 画面)
- **行数:** 341 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `formatShiftCell`
- `getCellClass`
- `getShift`
- `toggleUserExpand`
- `AdminMonthlyShiftsPage`
- `getHeaderClass`
- `fetchData`
- `getPaidLeaveApp`

### 型定義 / インターフェース
- `User`
- `Shift`
- `if`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `react`, `@/components/ui/tooltip`, `date-fns`, `lucide-react`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `date-fns/locale`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSaturday, isSunday } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, CalendarRange } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"

interface User {
```

---

## <a id="frontend-src-app-(admin)-paid-leaves-page-tsx"></a> frontend/src/app/(admin)/paid-leaves/page.tsx

- **ファイル概要:** 画面UIコンポーネント (paid-leaves 画面)
- **行数:** 499 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `AdminPaidLeavesPage`
- `fetchInitialData`
- `handleGrant`
- `normalizeDateStr`
- `fetchSummary`

### 型定義 / インターフェース
- `LeaveLedger`
- `LeaveType`
- `UserLeaveSummary`
- `LeaveLedgerSummary`
- `LeaveHistoryItem`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `@/components/ui/date-input`, `react`, `date-fns`, `@/components/ui/input`, `lucide-react`, `@/components/ui/table`, `@/components/ui/label`, `sonner`, `@/components/ui/button`, `@/types`, `@/components/ui/card`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-project-roles-page-tsx"></a> frontend/src/app/(admin)/project-roles/page.tsx

- **ファイル概要:** 画面UIコンポーネント (project-roles 画面)
- **行数:** 278 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchRoles`
- `handleSubmit`
- `handleOpenDialog`
- `ProjectRolesPage`
- `handleDelete`

### 型定義 / インターフェース
- `ProjectRole`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/table`, `sonner`, `@/components/ui/button`, `@/components/ui/alert-dialog`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
```

---

## <a id="frontend-src-app-(admin)-projects-page-tsx"></a> frontend/src/app/(admin)/projects/page.tsx

- **ファイル概要:** 画面UIコンポーネント (projects 画面)
- **行数:** 651 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `TagSelector`
- `formatDateStr`
- `handleOpenDialog`
- `handleAddTag`
- `handleDelete`
- `AdminProjectsPage`
- `handleRemoveTag`
- `fetchProjects`
- `fetchUsers`
- `calculateSubmit`

### 型定義 / インターフェース
- `TagSelectorProps`
- `User`
- `Project`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/badge`, `@/components/ui/select`, `@/components/ui/date-input`, `react`, `@/components/ui/switch`, `date-fns`, `@/components/ui/input`, `lucide-react`, `@/components/ui/table`, `@/components/ui/label`, `sonner`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-shifts-page-tsx"></a> frontend/src/app/(admin)/shifts/page.tsx

- **ファイル概要:** 画面UIコンポーネント (shifts 画面)
- **行数:** 301 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `getUserName`
- `AdminShiftsPage`
- `handleOpenNewShift`
- `handleBulkApprove`
- `handleEditShift`
- `handleApproveShift`

### 主な依存モジュール (Imports)
`@/components/ui/label`, `@/components/admin/shifts/ShiftFilters`, `@/components/admin/shifts/HolidayGenerator`, `@/components/admin/shifts/ShiftDialog`, `@/components/ui/date-input`, `lucide-react`, `@/components/ui/table`, `@/components/ui/select`, `react`, `date-fns`, `@/components/admin/shifts/ShiftGenerator`, `@/components/admin/shifts/TemplateManager`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(admin)-system-definitions-page-tsx"></a> frontend/src/app/(admin)/system-definitions/page.tsx

- **ファイル概要:** 画面UIコンポーネント (system-definitions 画面)
- **行数:** 244 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `openCreate`
- `handleDelete`
- `handleSave`
- `SystemDefinitionsPage`
- `openEdit`
- `fetchDefinitions`

### 型定義 / インターフェース
- `SystemDefinition`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/table`, `@/components/ui/label`, `@/components/ui/button`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
```

---

## <a id="frontend-src-app-(admin)-task-categories-page-tsx"></a> frontend/src/app/(admin)/task-categories/page.tsx

- **ファイル概要:** 画面UIコンポーネント (task-categories 画面)
- **行数:** 260 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchCategories`
- `handleSubmit`
- `handleOpenDialog`
- `AdminTaskCategoriesPage`
- `handleDelete`

### 型定義 / インターフェース
- `TaskCategory`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/table`, `sonner`, `@/components/ui/button`, `@/components/ui/alert-dialog`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
```

---

## <a id="frontend-src-app-(admin)-users-page-tsx"></a> frontend/src/app/(admin)/users/page.tsx

- **ファイル概要:** 画面UIコンポーネント (users 画面)
- **行数:** 584 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchDepartments`
- `handleOpenDialog`
- `handleSubmit`
- `handleDelete`
- `getStatusLabel`
- `fetchWorkRules`
- `getRoleLabel`
- `fetchUsers`
- `getWorkRuleName`
- `getRoleBadgeColor`

### 型定義 / インターフェース
- `Department`
- `User`
- `WorkRule`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/table`, `sonner`, `@/components/ui/button`, `@/components/ui/card`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useEffect, useState } from "react";
import { UserCog, Pencil, Building, User as UserIcon, Clock, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
```

---

## <a id="frontend-src-app-(auth)-login-page-tsx"></a> frontend/src/app/(auth)/login/page.tsx

- **ファイル概要:** 画面UIコンポーネント (login 画面)
- **行数:** 95 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleLogin`
- `LoginPage`

### 主な依存モジュール (Imports)
`react`, `@/components/ui/input`, `lucide-react`, `next/navigation`, `@/components/ui/label`, `sonner`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, Mail, User } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants";

import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner";

export default function LoginPage() {
```

---

## <a id="frontend-src-app-(leader)-layout-tsx"></a> frontend/src/app/(leader)/layout.tsx

- **ファイル概要:** layout.tsx モジュール / 設定ファイル
- **行数:** 13 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `LeaderLayout`

### 主な依存モジュール (Imports)
`@/components/layout/app-layout`

### コード先頭プレビュー
```text
import SharedLayout from "@/components/layout/app-layout";

export default function LeaderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SharedLayout>
            {children}
        </SharedLayout>
    );
}
```

---

## <a id="frontend-src-app-(leader)-project-assignments-page-tsx"></a> frontend/src/app/(leader)/project-assignments/page.tsx

- **ファイル概要:** 画面UIコンポーネント (project-assignments 画面)
- **行数:** 291 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleSave`
- `handleToggleMember`
- `handleRoleChange`
- `ProjectAssignmentsPage`
- `fetchData`

### 型定義 / インターフェース
- `ProjectRole`
- `User`
- `Project`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `react`, `lucide-react`, `@/components/ui/checkbox`, `sonner`, `@/components/ui/button`, `@/lib/utils`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client";
import { BACKEND_URL } from "@/lib/constants";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
```

---

## <a id="frontend-src-app-(user)-applications-page-tsx"></a> frontend/src/app/(user)/applications/page.tsx

- **ファイル概要:** 画面UIコンポーネント (applications 画面)
- **行数:** 748 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchLeaveSummary`
- `fetchTemplates`
- `handleDynamicInputChange`
- `getPaidLeaveBreakdown`
- `handleSubmit`
- `ApplicationPage`
- `isLeaveTypeFullDay`
- `getLeaveTypeValue`
- `normalizeDateStr`
- `getOptionsForSelect`

### 型定義 / インターフェース
- `if`
- `ApplicationTemplate`
- `ApplicationTemplateItemConfig`
- `update`
- `Application`
- `changes`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `@/components/ui/date-input`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/ui/textarea`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
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

```

---

## <a id="frontend-src-app-(user)-calendar-page-tsx"></a> frontend/src/app/(user)/calendar/page.tsx

- **ファイル概要:** 画面UIコンポーネント (calendar 画面)
- **行数:** 431 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `formatTime`
- `prevMonth`
- `AttendanceCalendarPage`
- `fetchRecords`
- `handleDayClick`
- `nextMonth`
- `getRecordForDay`
- `handleCancelShiftRequest`

### 型定義 / インターフェース
- `Attendance`
- `DailyRecord`

### 主な依存モジュール (Imports)
`@/components/StampCorrectionModal`, `@/components/ShiftRequestModal`, `react`, `lucide-react`, `next/navigation`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { BACKEND_URL } from "@/lib/constants"
import StampCorrectionModal from "@/components/StampCorrectionModal"
import ShiftRequestModal from "@/components/ShiftRequestModal"

interface Attendance {
    clock_in: string | null;
```

---

## <a id="frontend-src-app-(user)-daily-report-page-tsx"></a> frontend/src/app/(user)/daily-report/page.tsx

- **ファイル概要:** 画面UIコンポーネント (daily-report 画面)
- **行数:** 576 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `fetchSelectOptions`
- `handleShiftTypeChange`
- `addLog`
- `removeLog`
- `handleSave`
- `updateLog`
- `DailyReportPage`
- `formatToSlash`
- `DailyReportContent`
- `normalizeDateStr`

### 型定義 / インターフェース
- `ShiftTemplate`
- `WorkLog`
- `TaskCategory`
- `fetched`
- `Project`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `@/components/ui/date-input`, `@/lib/ui_text`, `react`, `@/components/ui/input`, `lucide-react`, `next/navigation`, `@/components/ui/label`, `@/components/ui/table`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(user)-dashboard-DashboardClient-tsx"></a> frontend/src/app/(user)/dashboard/DashboardClient.tsx

- **ファイル概要:** DashboardClient.tsx モジュール / 設定ファイル
- **行数:** 248 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `DashboardClient`

### 型定義 / インターフェース
- `DashboardClientProps`
- `DashboardSummary`

### 主な依存モジュール (Imports)
`react`, `framer-motion`, `lucide-react`, `next/navigation`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/ui/alert`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, Briefcase, Calendar as CalendarIcon, FileText, AlertTriangle, LayoutGrid } from "lucide-react"
// import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"

const container = {
    hidden: { opacity: 0 },
    show: {
```

---

## <a id="frontend-src-app-(user)-dashboard-page-tsx"></a> frontend/src/app/(user)/dashboard/page.tsx

- **ファイル概要:** 画面UIコンポーネント (dashboard 画面)
- **行数:** 56 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `getData`
- `DashboardPage`

### 主な依存モジュール (Imports)
`./DashboardClient`, `next/headers`, `next/navigation`

### コード先頭プレビュー
```text
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

// Helper to fetch data on server
async function getData(token: string) {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"; // Use internal URL for SS

    try {
        const [summaryRes, userRes] = await Promise.all([
            fetch(`${backendUrl}/api/v1/dashboard/my-summary`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }),
            fetch(`${backendUrl}/api/v1/users/me`, {
```

---

## <a id="frontend-src-app-(user)-layout-tsx"></a> frontend/src/app/(user)/layout.tsx

- **ファイル概要:** layout.tsx モジュール / 設定ファイル
- **行数:** 13 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `UserLayout`

### 主な依存モジュール (Imports)
`@/components/layout/app-layout`

### コード先頭プレビュー
```text
import SharedLayout from "@/components/layout/app-layout";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SharedLayout>
            {children}
        </SharedLayout>
    );
}
```

---

## <a id="frontend-src-app-(user)-monthly-reports-page-tsx"></a> frontend/src/app/(user)/monthly-reports/page.tsx

- **ファイル概要:** 画面UIコンポーネント (monthly-reports 画面)
- **行数:** 234 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `formatTime`
- `prevMonth`
- `formatMinutes`
- `getDayColor`
- `MonthlyReportPage`
- `fetchRecords`
- `isNonWorkingDay`
- `nextMonth`

### 型定義 / インターフェース
- `WorkLogWithDetails`
- `ProjectBase`
- `TaskCategoryBase`
- `AttendanceResponse`
- `CalendarDailyResponse`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `react`, `@/components/ui/tooltip`, `date-fns`, `lucide-react`, `next/navigation`, `@/components/ui/table`, `@/components/ui/button`, `@/lib/utils`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
```

---

## <a id="frontend-src-app-(user)-settings-page-tsx"></a> frontend/src/app/(user)/settings/page.tsx

- **ファイル概要:** 画面UIコンポーネント (settings 画面)
- **行数:** 189 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleSaveRule`
- `fetchWorkRules`
- `handleConfigChange`
- `SettingsPage`

### 主な依存モジュール (Imports)
`react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/ui/tabs`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { BACKEND_URL } from "@/lib/constants";

export default function SettingsPage() {
```

---

## <a id="frontend-src-app-(user)-skills-portfolio-page-tsx"></a> frontend/src/app/(user)/skills-portfolio/page.tsx

- **ファイル概要:** 画面UIコンポーネント (skills-portfolio 画面)
- **行数:** 324 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `SkillsPortfolioPage`
- `fetchUsers`
- `fetchSkills`

### 型定義 / インターフェース
- `SkillItem`
- `User`
- `SkillsData`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `react`, `lucide-react`, `sonner`, `recharts`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
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
```

---

## <a id="frontend-src-app-(user)-stamp-page-tsx"></a> frontend/src/app/(user)/stamp/page.tsx

- **ファイル概要:** 画面UIコンポーネント (stamp 画面)
- **行数:** 296 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `formatDateTime`
- `fetchShift`
- `fetchStatus`
- `handleClockIn`
- `handleGetLocation`
- `fetchAddress`
- `handleClockOut`
- `StampPage`

### 主な依存モジュール (Imports)
`@/components/StampCorrectionModal`, `react`, `lucide-react`, `@/components/ui/button`, `@/components/ui/card`, `@/context/AuthContext`, `@/lib/constants`, `@/components/layout/page-header`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, Loader2, Clock } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants";
import StampCorrectionModal from "@/components/StampCorrectionModal"
import { PageHeader } from "@/components/layout/page-header"

export default function StampPage() {
  const { isAuthenticated } = useAuth() || {};
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string | null>(null)
```

---

## <a id="frontend-src-app-api-auth-login-route-ts"></a> frontend/src/app/api/auth/login/route.ts

- **ファイル概要:** Next.js Route Handler (BFF API / 認証プロキシ)
- **行数:** 51 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `POST`

### 主な依存モジュール (Imports)
`next/headers`, `next/server`

### コード先頭プレビュー
```text
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

let BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
if (!process.env.BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL) {
    BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/v1\/?$/, "");
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        const formData = new URLSearchParams();
        formData.append("username", username);
```

---

## <a id="frontend-src-app-api-auth-logout-route-ts"></a> frontend/src/app/api/auth/logout/route.ts

- **ファイル概要:** Next.js Route Handler (BFF API / 認証プロキシ)
- **行数:** 8 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `POST`

### 主な依存モジュール (Imports)
`next/headers`, `next/server`

### コード先頭プレビュー
```text
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    return NextResponse.json({ success: true });
}
```

---

## <a id="frontend-src-app-api-v1-[---path]-route-ts"></a> frontend/src/app/api/v1/[...path]/route.ts

- **ファイル概要:** Next.js Route Handler (BFF API / 認証プロキシ)
- **行数:** 83 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `handleProxy`

### 主な依存モジュール (Imports)
`@/lib/constants`, `next/headers`, `next/server`

### コード先頭プレビュー
```text
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

let BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
if (!process.env.BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL) {
    BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/v1\/?$/, "");
}

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    console.log(`[Proxy] Incoming request: ${request.method} ${request.url}`);
```

---

## <a id="frontend-src-app-globals-css"></a> frontend/src/app/globals.css

- **ファイル概要:** globals.css モジュール / 設定ファイル
- **行数:** 152 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コード先頭プレビュー
```text
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
```

---

## <a id="frontend-src-app-layout-tsx"></a> frontend/src/app/layout.tsx

- **ファイル概要:** layout.tsx モジュール / 設定ファイル
- **行数:** 45 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `RootLayout`

### 主な依存モジュール (Imports)
`next/font/google`, `@/components/theme-provider`, `next`, `@/context/AuthContext`, `@/components/ui/sonner`

### コード先頭プレビュー
```text
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR-Connect - オールインワン労務管理システム",
  description: "「勤怠管理」「シフト管理」「申請」「日報（工数）」を単一のプラットフォームで統合管理する労務管理システム",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
```

---

## <a id="frontend-src-app-page-tsx"></a> frontend/src/app/page.tsx

- **ファイル概要:** 画面UIコンポーネント (app 画面)
- **行数:** 5 行
- **カテゴリ:** フロントエンド画面 (Next.js App Router / BFF)

### コンポーネント / 関数
- `Home`

### 主な依存モジュール (Imports)
`next/navigation`

### コード先頭プレビュー
```text
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
```

---

