# フロントエンドUI部品 & 状態管理 & 共通関数 仕様詳細書

本ドキュメントは、HRConnectにおける「フロントエンドUI部品 & 状態管理 & 共通関数」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 44 ファイル

---

## 掲載ファイル一覧

- [`frontend/src/components/ShiftRequestModal.tsx`](#frontend-src-components-ShiftRequestModal-tsx) : ShiftRequestModal.tsx モジュール / 設定ファイル
- [`frontend/src/components/StampCorrectionModal.tsx`](#frontend-src-components-StampCorrectionModal-tsx) : StampCorrectionModal.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/attendances/AttendanceFilter.tsx`](#frontend-src-components-admin-attendances-AttendanceFilter-tsx) : AttendanceFilter.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/attendances/AttendanceTable.tsx`](#frontend-src-components-admin-attendances-AttendanceTable-tsx) : AttendanceTable.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/shifts/HolidayGenerator.tsx`](#frontend-src-components-admin-shifts-HolidayGenerator-tsx) : HolidayGenerator.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/shifts/ShiftDialog.tsx`](#frontend-src-components-admin-shifts-ShiftDialog-tsx) : ShiftDialog.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/shifts/ShiftFilters.tsx`](#frontend-src-components-admin-shifts-ShiftFilters-tsx) : ShiftFilters.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/shifts/ShiftGenerator.tsx`](#frontend-src-components-admin-shifts-ShiftGenerator-tsx) : ShiftGenerator.tsx モジュール / 設定ファイル
- [`frontend/src/components/admin/shifts/TemplateManager.tsx`](#frontend-src-components-admin-shifts-TemplateManager-tsx) : TemplateManager.tsx モジュール / 設定ファイル
- [`frontend/src/components/layout/app-layout.tsx`](#frontend-src-components-layout-app-layout-tsx) : app-layout.tsx モジュール / 設定ファイル
- [`frontend/src/components/layout/bottom-navbar.tsx`](#frontend-src-components-layout-bottom-navbar-tsx) : bottom-navbar.tsx モジュール / 設定ファイル
- [`frontend/src/components/layout/page-header.tsx`](#frontend-src-components-layout-page-header-tsx) : page-header.tsx モジュール / 設定ファイル
- [`frontend/src/components/layout/sidebar.tsx`](#frontend-src-components-layout-sidebar-tsx) : sidebar.tsx モジュール / 設定ファイル
- [`frontend/src/components/theme-provider.tsx`](#frontend-src-components-theme-provider-tsx) : theme-provider.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/alert-dialog.tsx`](#frontend-src-components-ui-alert-dialog-tsx) : alert-dialog.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/alert.tsx`](#frontend-src-components-ui-alert-tsx) : alert.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/avatar.tsx`](#frontend-src-components-ui-avatar-tsx) : avatar.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/badge.tsx`](#frontend-src-components-ui-badge-tsx) : badge.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/button.tsx`](#frontend-src-components-ui-button-tsx) : button.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/card.tsx`](#frontend-src-components-ui-card-tsx) : card.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/checkbox.tsx`](#frontend-src-components-ui-checkbox-tsx) : checkbox.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/date-input.tsx`](#frontend-src-components-ui-date-input-tsx) : date-input.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/dialog.tsx`](#frontend-src-components-ui-dialog-tsx) : dialog.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/dropdown-menu.tsx`](#frontend-src-components-ui-dropdown-menu-tsx) : dropdown-menu.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/input.tsx`](#frontend-src-components-ui-input-tsx) : input.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/label.tsx`](#frontend-src-components-ui-label-tsx) : label.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/select.tsx`](#frontend-src-components-ui-select-tsx) : select.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/sheet.tsx`](#frontend-src-components-ui-sheet-tsx) : sheet.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/skeleton.tsx`](#frontend-src-components-ui-skeleton-tsx) : skeleton.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/sonner.tsx`](#frontend-src-components-ui-sonner-tsx) : sonner.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/switch.tsx`](#frontend-src-components-ui-switch-tsx) : switch.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/table.tsx`](#frontend-src-components-ui-table-tsx) : table.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/tabs.tsx`](#frontend-src-components-ui-tabs-tsx) : tabs.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/textarea.tsx`](#frontend-src-components-ui-textarea-tsx) : textarea.tsx モジュール / 設定ファイル
- [`frontend/src/components/ui/tooltip.tsx`](#frontend-src-components-ui-tooltip-tsx) : tooltip.tsx モジュール / 設定ファイル
- [`frontend/src/components/user-menu.tsx`](#frontend-src-components-user-menu-tsx) : user-menu.tsx モジュール / 設定ファイル
- [`frontend/src/context/AuthContext.tsx`](#frontend-src-context-AuthContext-tsx) : AuthContext.tsx モジュール / 設定ファイル
- [`frontend/src/hooks/useAdminAttendances.ts`](#frontend-src-hooks-useAdminAttendances-ts) : useAdminAttendances.ts モジュール / 設定ファイル
- [`frontend/src/hooks/useShiftManagement.ts`](#frontend-src-hooks-useShiftManagement-ts) : useShiftManagement.ts モジュール / 設定ファイル
- [`frontend/src/hooks/useShiftMutations.ts`](#frontend-src-hooks-useShiftMutations-ts) : useShiftMutations.ts モジュール / 設定ファイル
- [`frontend/src/lib/constants.ts`](#frontend-src-lib-constants-ts) : constants.ts モジュール / 設定ファイル
- [`frontend/src/lib/ui_text.ts`](#frontend-src-lib-ui_text-ts) : ui_text.ts モジュール / 設定ファイル
- [`frontend/src/lib/utils.ts`](#frontend-src-lib-utils-ts) : utils.ts モジュール / 設定ファイル
- [`frontend/src/types/index.ts`](#frontend-src-types-index-ts) : index.ts モジュール / 設定ファイル

---

## <a id="frontend-src-components-ShiftRequestModal-tsx"></a> frontend/src/components/ShiftRequestModal.tsx

- **ファイル概要:** ShiftRequestModal.tsx モジュール / 設定ファイル
- **行数:** 204 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `ShiftRequestModal`
- `handleShiftTypeChange`
- `handleSubmit`
- `formatTime`

### 型定義 / インターフェース
- `ShiftRequestModalProps`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `react`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/button`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BACKEND_URL } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"

// 希望シフト申請モーダルのプロパティ定義
interface ShiftRequestModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string // YYYY-MM-DD 形式
    onSubmitSuccess: () => void
```

---

## <a id="frontend-src-components-StampCorrectionModal-tsx"></a> frontend/src/components/StampCorrectionModal.tsx

- **ファイル概要:** StampCorrectionModal.tsx モジュール / 設定ファイル
- **行数:** 239 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `formatToTimeInput`
- `createISODatetime`
- `handleSubmit`
- `fetchShift`
- `StampCorrectionModal`

### 型定義 / インターフェース
- `StampCorrectionModalProps`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/button`, `@/context/AuthContext`, `@/lib/constants`, `@/components/ui/textarea`

### コード先頭プレビュー
```text
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"

interface StampCorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
```

---

## <a id="frontend-src-components-admin-attendances-AttendanceFilter-tsx"></a> frontend/src/components/admin/attendances/AttendanceFilter.tsx

- **ファイル概要:** AttendanceFilter.tsx モジュール / 設定ファイル
- **行数:** 60 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `AttendanceFilter`

### 型定義 / インターフェース
- `AttendanceFilterProps`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `date-fns`, `lucide-react`, `@/components/ui/button`, `@/types`, `date-fns/locale`

### コード先頭プレビュー
```text
import { format, subMonths, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { User } from "@/types"

interface AttendanceFilterProps {
    currentDate: Date
```

---

## <a id="frontend-src-components-admin-attendances-AttendanceTable-tsx"></a> frontend/src/components/admin/attendances/AttendanceTable.tsx

- **ファイル概要:** AttendanceTable.tsx モジュール / 設定ファイル
- **行数:** 109 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `AttendanceTable`
- `formatDuration`
- `formatTime`

### 型定義 / インターフェース
- `AttendanceTableProps`

### 主な依存モジュール (Imports)
`date-fns`, `lucide-react`, `@/components/ui/alert-dialog`, `@/components/ui/button`, `@/types`

### コード先頭プレビュー
```text
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Attendance } from "@/types"
```

---

## <a id="frontend-src-components-admin-shifts-HolidayGenerator-tsx"></a> frontend/src/components/admin/shifts/HolidayGenerator.tsx

- **ファイル概要:** HolidayGenerator.tsx モジュール / 設定ファイル
- **行数:** 119 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `HolidayGenerator`
- `handleGenerate`

### 型定義 / インターフェース
- `HolidayGeneratorProps`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `@/components/ui/date-input`, `react`, `@/components/ui/input`, `date-fns`, `@/components/ui/label`, `@/components/ui/button`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format, startOfMonth, endOfMonth } from "date-fns"

interface HolidayGeneratorProps {
    users: User[]
    onUpdate: () => void
```

---

## <a id="frontend-src-components-admin-shifts-ShiftDialog-tsx"></a> frontend/src/components/admin/shifts/ShiftDialog.tsx

- **ファイル概要:** ShiftDialog.tsx モジュール / 設定ファイル
- **行数:** 301 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `handleSaveShift`
- `handleTemplateChange`
- `ShiftDialog`

### 型定義 / インターフェース
- `ShiftDialogProps`
- `ShiftFormData`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `@/components/ui/date-input`, `react`, `@/components/ui/input`, `date-fns`, `@/components/ui/label`, `@/components/ui/button`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shift, User, ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format } from "date-fns"

interface ShiftDialogProps {
    isOpen: boolean
    onClose: () => void
```

---

## <a id="frontend-src-components-admin-shifts-ShiftFilters-tsx"></a> frontend/src/components/admin/shifts/ShiftFilters.tsx

- **ファイル概要:** ShiftFilters.tsx モジュール / 設定ファイル
- **行数:** 98 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `ShiftFilters`

### 型定義 / インターフェース
- `User`
- `ShiftFiltersProps`

### 主な依存モジュール (Imports)
`@/components/ui/select`, `date-fns`, `lucide-react`, `@/components/ui/button`, `@/types`

### コード先頭プレビュー
```text
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { ShiftTemplate } from "@/types"

interface User {
    id: string
    name: string
```

---

## <a id="frontend-src-components-admin-shifts-ShiftGenerator-tsx"></a> frontend/src/components/admin/shifts/ShiftGenerator.tsx

- **ファイル概要:** ShiftGenerator.tsx モジュール / 設定ファイル
- **行数:** 210 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `handleTemplateChange`
- `ShiftGenerator`
- `handleGenerate`

### 型定義 / インターフェース
- `ShiftGeneratorProps`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `@/components/ui/select`, `@/components/ui/date-input`, `react`, `@/components/ui/input`, `date-fns`, `@/components/ui/label`, `@/components/ui/button`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { format, addMonths } from "date-fns"

interface ShiftGeneratorProps {
    users: User[]
    templates: ShiftTemplate[]
```

---

## <a id="frontend-src-components-admin-shifts-TemplateManager-tsx"></a> frontend/src/components/admin/shifts/TemplateManager.tsx

- **ファイル概要:** TemplateManager.tsx モジュール / 設定ファイル
- **行数:** 103 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `TemplateManager`
- `handleCreateTemplate`
- `handleDeleteTemplate`

### 型定義 / インターフェース
- `TemplateManagerProps`

### 主な依存モジュール (Imports)
`@/components/ui/dialog`, `react`, `@/components/ui/input`, `lucide-react`, `@/components/ui/label`, `@/components/ui/button`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { ShiftTemplate } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"

interface TemplateManagerProps {
    templates: ShiftTemplate[]
    onUpdate: () => void
}

```

---

## <a id="frontend-src-components-layout-app-layout-tsx"></a> frontend/src/components/layout/app-layout.tsx

- **ファイル概要:** app-layout.tsx モジュール / 設定ファイル
- **行数:** 36 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `SharedLayout`

### 主な依存モジュール (Imports)
`@/components/layout/bottom-navbar`, `@/lib/utils`, `@/components/layout/sidebar`, `react`

### コード先頭プレビュー
```text
"use client"

import { useState } from "react"
import { Sidebar, MobileSidebarTrigger } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { BottomNavbar } from "@/components/layout/bottom-navbar";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
```

---

## <a id="frontend-src-components-layout-bottom-navbar-tsx"></a> frontend/src/components/layout/bottom-navbar.tsx

- **ファイル概要:** bottom-navbar.tsx モジュール / 設定ファイル
- **行数:** 52 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `BottomNavbar`
- `NavItem`

### 型定義 / インターフェース
- `NavItemProps`

### 主な依存モジュール (Imports)
`@/lib/utils`, `lucide-react`, `next/link`, `next/navigation`

### コード先頭プレビュー
```text
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, FileText, CalendarCheck, Home } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isCurrent: boolean;
}

```

---

## <a id="frontend-src-components-layout-page-header-tsx"></a> frontend/src/components/layout/page-header.tsx

- **ファイル概要:** page-header.tsx モジュール / 設定ファイル
- **行数:** 42 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `PageHeader`

### 型定義 / インターフェース
- `PageHeaderProps`

### 主な依存モジュール (Imports)
`lucide-react`, `react`

### コード先頭プレビュー
```text
"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

// 共通ヘッダーコンポーネントのProps型定義
interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children?: ReactNode;
}

// すべての画面で共通利用するGlassmorphismデザインのヘッダーコンポーネント
export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
```

---

## <a id="frontend-src-components-layout-sidebar-tsx"></a> frontend/src/components/layout/sidebar.tsx

- **ファイル概要:** sidebar.tsx モジュール / 設定ファイル
- **行数:** 290 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `NavLink`
- `MobileSidebarTrigger`
- `SidebarContent`
- `Sidebar`

### 型定義 / インターフェース
- `SidebarProps`
- `NavLinkProps`

### 主な依存モジュール (Imports)
`@/components/user-menu`, `react`, `@/components/ui/sheet`, `lucide-react`, `next/link`, `next/navigation`, `@/components/ui/button`, `@/lib/utils`, `@/context/AuthContext`

### コード先頭プレビュー
```text
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Clock, CalendarCheck, FileText, Settings, Users, LineChart, Briefcase, Layers, Ticket, History, Building, Archive, Calendar, ChevronLeft, ChevronRight, Table as TableIcon, Shield
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
```

---

## <a id="frontend-src-components-theme-provider-tsx"></a> frontend/src/components/theme-provider.tsx

- **ファイル概要:** theme-provider.tsx モジュール / 設定ファイル
- **行数:** 11 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `ThemeProvider`

### 主な依存モジュール (Imports)
`next-themes`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

## <a id="frontend-src-components-ui-alert-dialog-tsx"></a> frontend/src/components/ui/alert-dialog.tsx

- **ファイル概要:** alert-dialog.tsx モジュール / 設定ファイル
- **行数:** 141 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `AlertDialogHeader`
- `AlertDialogFooter`

### 主な依存モジュール (Imports)
`@radix-ui/react-alert-dialog`, `@/components/ui/button`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
```

---

## <a id="frontend-src-components-ui-alert-tsx"></a> frontend/src/components/ui/alert.tsx

- **ファイル概要:** alert.tsx モジュール / 設定ファイル
- **行数:** 66 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `AlertTitle`
- `Alert`
- `AlertDescription`

### 型定義 / インターフェース
- `VariantProps`

### 主な依存モジュール (Imports)
`class-variance-authority`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
```

---

## <a id="frontend-src-components-ui-avatar-tsx"></a> frontend/src/components/ui/avatar.tsx

- **ファイル概要:** avatar.tsx モジュール / 設定ファイル
- **行数:** 53 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Avatar`
- `AvatarFallback`
- `AvatarImage`

### 主な依存モジュール (Imports)
`@/lib/utils`, `@radix-ui/react-avatar`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
```

---

## <a id="frontend-src-components-ui-badge-tsx"></a> frontend/src/components/ui/badge.tsx

- **ファイル概要:** badge.tsx モジュール / 設定ファイル
- **行数:** 46 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Badge`

### 型定義 / インターフェース
- `VariantProps`

### 主な依存モジュール (Imports)
`@radix-ui/react-slot`, `class-variance-authority`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
```

---

## <a id="frontend-src-components-ui-button-tsx"></a> frontend/src/components/ui/button.tsx

- **ファイル概要:** button.tsx モジュール / 設定ファイル
- **行数:** 61 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Button`

### 型定義 / インターフェース
- `VariantProps`

### 主な依存モジュール (Imports)
`@radix-ui/react-slot`, `class-variance-authority`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
```

---

## <a id="frontend-src-components-ui-card-tsx"></a> frontend/src/components/ui/card.tsx

- **ファイル概要:** card.tsx モジュール / 設定ファイル
- **行数:** 92 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `CardAction`
- `Card`
- `CardFooter`
- `CardHeader`
- `CardTitle`
- `CardContent`
- `CardDescription`

### 主な依存モジュール (Imports)
`@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
```

---

## <a id="frontend-src-components-ui-checkbox-tsx"></a> frontend/src/components/ui/checkbox.tsx

- **ファイル概要:** checkbox.tsx モジュール / 設定ファイル
- **行数:** 32 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Checkbox`

### 主な依存モジュール (Imports)
`@radix-ui/react-checkbox`, `lucide-react`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
```

---

## <a id="frontend-src-components-ui-date-input-tsx"></a> frontend/src/components/ui/date-input.tsx

- **ファイル概要:** date-input.tsx モジュール / 設定ファイル
- **行数:** 81 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `DateInput`

### 型定義 / インターフェース
- `DateInputProps`

### 主な依存モジュール (Imports)
`./input`, `react`

### コード先頭プレビュー
```text
"use client";

import React from "react";
import { Input } from "./input";

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}

```

---

## <a id="frontend-src-components-ui-dialog-tsx"></a> frontend/src/components/ui/dialog.tsx

- **ファイル概要:** dialog.tsx モジュール / 設定ファイル
- **行数:** 143 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `DialogContent`
- `Dialog`
- `DialogClose`
- `DialogPortal`
- `DialogTitle`
- `DialogOverlay`
- `DialogHeader`
- `DialogFooter`
- `DialogDescription`
- `DialogTrigger`

### 主な依存モジュール (Imports)
`@/lib/utils`, `lucide-react`, `@radix-ui/react-dialog`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
```

---

## <a id="frontend-src-components-ui-dropdown-menu-tsx"></a> frontend/src/components/ui/dropdown-menu.tsx

- **ファイル概要:** dropdown-menu.tsx モジュール / 設定ファイル
- **行数:** 257 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `DropdownMenuSubTrigger`
- `DropdownMenuSeparator`
- `DropdownMenuTrigger`
- `DropdownMenuItem`
- `DropdownMenuRadioGroup`
- `DropdownMenuGroup`
- `DropdownMenuShortcut`
- `DropdownMenuPortal`
- `DropdownMenuCheckboxItem`
- `DropdownMenuSubContent`

### 主な依存モジュール (Imports)
`lucide-react`, `@radix-ui/react-dropdown-menu`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
```

---

## <a id="frontend-src-components-ui-input-tsx"></a> frontend/src/components/ui/input.tsx

- **ファイル概要:** input.tsx モジュール / 設定ファイル
- **行数:** 21 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Input`

### 主な依存モジュール (Imports)
`@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
```

---

## <a id="frontend-src-components-ui-label-tsx"></a> frontend/src/components/ui/label.tsx

- **ファイル概要:** label.tsx モジュール / 設定ファイル
- **行数:** 26 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### 型定義 / インターフェース
- `VariantProps`

### 主な依存モジュール (Imports)
`@/lib/utils`, `class-variance-authority`, `@radix-ui/react-label`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
```

---

## <a id="frontend-src-components-ui-select-tsx"></a> frontend/src/components/ui/select.tsx

- **ファイル概要:** select.tsx モジュール / 設定ファイル
- **行数:** 187 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `SelectContent`
- `SelectScrollDownButton`
- `Select`
- `SelectValue`
- `SelectGroup`
- `SelectScrollUpButton`
- `SelectItem`
- `SelectLabel`
- `SelectTrigger`
- `SelectSeparator`

### 主な依存モジュール (Imports)
`@/lib/utils`, `lucide-react`, `@radix-ui/react-select`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
```

---

## <a id="frontend-src-components-ui-sheet-tsx"></a> frontend/src/components/ui/sheet.tsx

- **ファイル概要:** sheet.tsx モジュール / 設定ファイル
- **行数:** 140 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `SheetFooter`
- `SheetHeader`

### 型定義 / インターフェース
- `SheetContentProps`
- `VariantProps`

### 主な依存モジュール (Imports)
`react`, `lucide-react`, `class-variance-authority`, `@/lib/utils`, `@radix-ui/react-dialog`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

```

---

## <a id="frontend-src-components-ui-skeleton-tsx"></a> frontend/src/components/ui/skeleton.tsx

- **ファイル概要:** skeleton.tsx モジュール / 設定ファイル
- **行数:** 13 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Skeleton`

### 主な依存モジュール (Imports)
`@/lib/utils`

### コード先頭プレビュー
```text
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---

## <a id="frontend-src-components-ui-sonner-tsx"></a> frontend/src/components/ui/sonner.tsx

- **ファイル概要:** sonner.tsx モジュール / 設定ファイル
- **行数:** 40 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Toaster`

### 型定義 / インターフェース
- `ToasterProps`

### 主な依存モジュール (Imports)
`sonner`, `lucide-react`, `next-themes`

### コード先頭プレビュー
```text
"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

```

---

## <a id="frontend-src-components-ui-switch-tsx"></a> frontend/src/components/ui/switch.tsx

- **ファイル概要:** switch.tsx モジュール / 設定ファイル
- **行数:** 31 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Switch`

### 主な依存モジュール (Imports)
`@radix-ui/react-switch`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
```

---

## <a id="frontend-src-components-ui-table-tsx"></a> frontend/src/components/ui/table.tsx

- **ファイル概要:** table.tsx モジュール / 設定ファイル
- **行数:** 116 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `TableRow`
- `TableHeader`
- `TableBody`
- `Table`
- `TableCell`
- `TableCaption`
- `TableFooter`
- `TableHead`

### 主な依存モジュール (Imports)
`@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
```

---

## <a id="frontend-src-components-ui-tabs-tsx"></a> frontend/src/components/ui/tabs.tsx

- **ファイル概要:** tabs.tsx モジュール / 設定ファイル
- **行数:** 55 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### 主な依存モジュール (Imports)
`@radix-ui/react-tabs`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
```

---

## <a id="frontend-src-components-ui-textarea-tsx"></a> frontend/src/components/ui/textarea.tsx

- **ファイル概要:** textarea.tsx モジュール / 設定ファイル
- **行数:** 18 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Textarea`

### 主な依存モジュール (Imports)
`@/lib/utils`, `react`

### コード先頭プレビュー
```text
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
```

---

## <a id="frontend-src-components-ui-tooltip-tsx"></a> frontend/src/components/ui/tooltip.tsx

- **ファイル概要:** tooltip.tsx モジュール / 設定ファイル
- **行数:** 61 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `Tooltip`
- `TooltipContent`
- `TooltipTrigger`
- `TooltipProvider`

### 主な依存モジュール (Imports)
`@radix-ui/react-tooltip`, `@/lib/utils`, `react`

### コード先頭プレビュー
```text
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
```

---

## <a id="frontend-src-components-user-menu-tsx"></a> frontend/src/components/user-menu.tsx

- **ファイル概要:** user-menu.tsx モジュール / 設定ファイル
- **行数:** 82 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `UserMenu`
- `handleLogout`

### 主な依存モジュール (Imports)
`@/components/ui/dropdown-menu`, `@/components/ui/avatar`, `lucide-react`, `next/navigation`, `@/components/ui/button`, `@/context/AuthContext`

### コード先頭プレビュー
```text
"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
```

---

## <a id="frontend-src-context-AuthContext-tsx"></a> frontend/src/context/AuthContext.tsx

- **ファイル概要:** AuthContext.tsx モジュール / 設定ファイル
- **行数:** 109 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `login`
- `logout`
- `useAuth`
- `initAuth`
- `fetchUserProfile`
- `AuthProvider`

### 型定義 / インターフェース
- `AuthContextType`
- `User`

### 主な依存モジュール (Imports)
`@/lib/constants`, `next/navigation`, `react`

### コード先頭プレビュー
```text
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/constants";

interface User {
    id?: string;
    username: string;
    email: string;
    role?: string;
    name?: string;
}

interface AuthContextType {
```

---

## <a id="frontend-src-hooks-useAdminAttendances-ts"></a> frontend/src/hooks/useAdminAttendances.ts

- **ファイル概要:** useAdminAttendances.ts モジュール / 設定ファイル
- **行数:** 101 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `useAdminAttendances`
- `deleteAttendance`

### 主な依存モジュール (Imports)
`@/lib/ui_text`, `react`, `date-fns`, `sonner`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { toast } from "sonner"
import { UI_TEXT } from "@/lib/ui_text"

import { User, Attendance } from "@/types"

export const useAdminAttendances = () => {
    const { isAuthenticated } = useAuth() || {}
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedUser, setSelectedUser] = useState<string>("all")
```

---

## <a id="frontend-src-hooks-useShiftManagement-ts"></a> frontend/src/hooks/useShiftManagement.ts

- **ファイル概要:** useShiftManagement.ts モジュール / 設定ファイル
- **行数:** 76 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `useShiftManagement`

### 主な依存モジュール (Imports)
`react`, `date-fns`, `@/types`, `@/context/AuthContext`, `@/lib/constants`

### コード先頭プレビュー
```text
import { useState, useCallback, useEffect } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useAuth } from "@/context/AuthContext"
import { BACKEND_URL } from "@/lib/constants"
import { Shift, User, ShiftTemplate } from "@/types"

export const useShiftManagement = () => {
    const { isAuthenticated } = useAuth() || {}
    const [shifts, setShifts] = useState<Shift[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [templates, setTemplates] = useState<ShiftTemplate[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)

    const fetchUsers = useCallback(async () => {
```

---

## <a id="frontend-src-hooks-useShiftMutations-ts"></a> frontend/src/hooks/useShiftMutations.ts

- **ファイル概要:** useShiftMutations.ts モジュール / 設定ファイル
- **行数:** 101 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `handleDeleteShift`
- `handleBatchDelete`
- `handleFileUpload`
- `useShiftMutations`

### 主な依存モジュール (Imports)
`@/lib/constants`, `date-fns`, `react`

### コード先頭プレビュー
```text
import { useState, useRef } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { BACKEND_URL } from "@/lib/constants"

export const useShiftMutations = (isAuthenticated: boolean, onSuccess: () => void) => {
    // --- Batch Delete Local State ---
    const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
    const [batchDeleteTargetIds, setBatchDeleteTargetIds] = useState<string[]>([])
    const [batchDeleteStart, setBatchDeleteStart] = useState(format(startOfMonth(new Date()), "yyyy/MM/dd"))
    const [batchDeleteEnd, setBatchDeleteEnd] = useState(format(endOfMonth(new Date()), "yyyy/MM/dd"))

    // CSV Upload State
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handlers
```

---

## <a id="frontend-src-lib-constants-ts"></a> frontend/src/lib/constants.ts

- **ファイル概要:** constants.ts モジュール / 設定ファイル
- **行数:** 3 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コード先頭プレビュー
```text

export const BACKEND_URL = "";
export const AUTH_COOKIE_NAME = "token";
```

---

## <a id="frontend-src-lib-ui_text-ts"></a> frontend/src/lib/ui_text.ts

- **ファイル概要:** ui_text.ts モジュール / 設定ファイル
- **行数:** 38 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コード先頭プレビュー
```text
export const UI_TEXT = {
    COMMON: {
        LOADING: "読み込み中...",
        NO_DATA: "データがありません。",
        SAVE: "保存",
        CANCEL: "キャンセル",
        DELETE: "削除",
        EDIT: "編集",
        CONFIRM_DELETE: "削除確認",
        CONFIRM_DELETE_MESSAGE: "本当に削除しますか？この操作は取り消せません。",
        REQUIRED: "必須",
    },
    TOAST: {
        SAVE_SUCCESS: "保存しました！",
        SAVE_ERROR: "保存に失敗しました。",
```

---

## <a id="frontend-src-lib-utils-ts"></a> frontend/src/lib/utils.ts

- **ファイル概要:** utils.ts モジュール / 設定ファイル
- **行数:** 25 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### コンポーネント / 関数
- `joinUrl`
- `cn`

### 型定義 / インターフェース
- `ClassValue`

### 主な依存モジュール (Imports)
`tailwind-merge`, `clsx`, `@/lib/constants`

### コード先頭プレビュー
```text
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { BACKEND_URL } from "@/lib/constants";

/**
 * URLのパスを安全に結合します。
 * 重複するスラッシュを除去し、正しく結合されたURL文字列を返します。
 * @param baseUrl ベースURL (例: "http://localhost:8000")
 * @param path パス (例: "/api/v1/users")
 */
```

---

## <a id="frontend-src-types-index-ts"></a> frontend/src/types/index.ts

- **ファイル概要:** index.ts モジュール / 設定ファイル
- **行数:** 62 行
- **カテゴリ:** フロントエンドUI部品 & 状態管理 & 共通関数

### 型定義 / インターフェース
- `ShiftTemplate`
- `User`
- `Shift`
- `safety`
- `Department`
- `Application`
- `Attendance`

### コード先頭プレビュー
```text
/**
 * This file contains TypeScript interfaces that mirror the Backend (FastAPI/Pydantic) schemas.
 * Keeping these in sync is crucial for type safety across the stack.
 */

export interface Department {
    id: string;
    name: string;
}

export interface User {
    id: string;
    name: string;
    email?: string;
    user_id?: string; // Employee ID
```

---

