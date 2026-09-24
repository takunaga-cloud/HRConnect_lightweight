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
import { UserMenu } from "@/components/user-menu";


interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isCurrent: boolean;
  isCollapsed?: boolean;
}

function NavLink({ href, icon: Icon, label, isCurrent, isCollapsed }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
        isCurrent && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border",
        isCollapsed && "justify-center px-2"
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4" />
      {!isCollapsed && label}
    </Link>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const user = auth?.user;

  const userNavItems = [
    { href: "/dashboard", icon: Home, label: "ホーム" },
    { href: "/stamp", icon: Clock, label: "打刻" },
    { href: "/daily-report", icon: FileText, label: "日報" },
    { href: "/monthly-reports", icon: TableIcon, label: "月報" },
    { href: "/skills-portfolio", icon: LineChart, label: "スキルポートフォリオ" },
    { href: "/calendar", icon: Calendar, label: "勤怠カレンダー" },
    { href: "/applications", icon: CalendarCheck, label: "申請" },
    { href: "/monthly-shifts", icon: Calendar, label: "月間シフト一覧" },
    { href: "/settings", icon: Settings, label: "設定" },
  ];

  const adminNavItems = [
    { href: "/admin-dashboard", icon: LineChart, label: "ダッシュボード" },
    { href: "/admin-attendances", icon: Clock, label: "打刻管理" },
    { href: "/shifts", icon: CalendarCheck, label: "シフト管理" },
    { href: "/application-types", icon: FileText, label: "申請区分管理" },
    { href: "/attendance-categories", icon: Clock, label: "勤怠区分管理" },
    { href: "/system-definitions", icon: Settings, label: "システム定義管理" },
    { href: "/admin-applications", icon: FileText, label: "申請管理" },
    { href: "/approvals", icon: Users, label: "承認管理" },
    { href: "/analytics", icon: LineChart, label: "工数分析" },
    { href: "/departments", icon: Building, label: "部門管理" },
    { href: "/users", icon: Users, label: "ユーザー管理" },
    { href: "/projects", icon: Briefcase, label: "プロジェクト" },
    { href: "/project-roles", icon: Shield, label: "プロジェクト役割管理" },
    { href: "/task-categories", icon: Layers, label: "日報区分管理" },
    { href: "/paid-leaves", icon: Ticket, label: "有給管理" },
    { href: "/audit-logs", icon: History, label: "監査ログ" },
    { href: "/exports", icon: Archive, label: "月次処理" },
  ];

  const role = user?.role?.toLowerCase()?.trim() || "";
  const isLeaderOrHigher = ["admin", "manager", "leader"].includes(role);
  const isAdminOrManager = ["admin", "manager"].includes(role);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-md sm:flex transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}>
        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
          <div className={cn("flex items-center gap-2 font-semibold", isCollapsed && "justify-center")}>
            <img src="/logo.svg" alt="HR-Connect Logo" className="h-6 w-6" />
            {!isCollapsed && <span className="">HR-Connect</span>}
          </div>
          {onToggle && (
            <Button variant="ghost" size="icon" className={cn("ml-auto h-8 w-8", isCollapsed && "ml-0 mt-2")} onClick={onToggle}>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 overflow-auto py-4 px-4">
          {/* Navigation Content */}
          <nav className="grid items-start text-sm font-medium gap-1">
            <div className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground", isCollapsed && "text-center")}>
              {isCollapsed ? "一" : "一般ユーザー"}
            </div>
            {userNavItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} isCurrent={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
            {isLeaderOrHigher && (
              <>
                <div className={cn("mt-4 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground", isCollapsed && "text-center")}>
                  {isCollapsed ? "リ" : "リーダー"}
                </div>
                <NavLink
                  href="/project-assignments"
                  icon={Briefcase}
                  label="担当プロジェクト登録"
                  isCurrent={!!pathname?.startsWith("/project-assignments")}
                  isCollapsed={isCollapsed}
                />
              </>
            )}
            {isAdminOrManager && (
              <>
                <div className={cn("mt-4 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground", isCollapsed && "text-center")}>
                  {isCollapsed ? "管" : "管理業務"}
                </div>
                {adminNavItems.map((item) => (
                  <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} isCurrent={
                    item.href === "/" ? pathname === "/" : !!pathname?.startsWith(item.href)
                  } isCollapsed={isCollapsed} />
                ))}
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <UserMenu isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Mobile Trigger & Sheet - This is usually placed in a Header, but for simplicity we export a MobileNav trigger or include it here if we control layout */}
      {/* Since Sidebar component is acting as the ASIDE, we might want to expose a Mobile Nav component or handle it in the layout. 
          Let's assume the Layout will use smooth mobile sidebar. 
      */}
    </>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs p-0 h-full overflow-y-auto pb-8">
        <nav className="grid gap-6 text-lg font-medium p-6">
          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <img src="/logo.svg" alt="Logo" className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">HR-Connect</span>
          </Link>
          <SidebarContent onClose={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  )
}


function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const auth = useAuth();
  const user = auth?.user;

  const userNavItems = [
    { href: "/dashboard", icon: Home, label: "ホーム" },
    { href: "/stamp", icon: Clock, label: "打刻" },
    { href: "/daily-report", icon: FileText, label: "日報" },
    { href: "/monthly-reports", icon: TableIcon, label: "月報" },
    { href: "/skills-portfolio", icon: LineChart, label: "スキルポートフォリオ" },
    { href: "/calendar", icon: Calendar, label: "勤怠カレンダー" },
    { href: "/applications", icon: CalendarCheck, label: "申請" },
    { href: "/monthly-shifts", icon: Calendar, label: "月間シフト一覧" },
    { href: "/settings", icon: Settings, label: "設定" },
  ];

  const adminNavItems = [
    { href: "/admin-dashboard", icon: LineChart, label: "ダッシュボード" },
    { href: "/admin-attendances", icon: Clock, label: "打刻管理" },
    { href: "/shifts", icon: CalendarCheck, label: "シフト管理" },
    { href: "/application-types", icon: Clock, label: "申請区分管理" },
    { href: "/system-definitions", icon: Settings, label: "システム定義管理" },
    { href: "/admin-applications", icon: FileText, label: "申請管理" },
    { href: "/approvals", icon: Users, label: "承認管理" },
    { href: "/analytics", icon: LineChart, label: "工数分析" },
    { href: "/departments", icon: Building, label: "部門管理" },
    { href: "/users", icon: Users, label: "ユーザー管理" },
    { href: "/projects", icon: Briefcase, label: "プロジェクト" },
    { href: "/project-roles", icon: Shield, label: "プロジェクト役割管理" },
    { href: "/task-categories", icon: Layers, label: "日報区分管理" },
    { href: "/paid-leaves", icon: Ticket, label: "有給管理" },
    { href: "/audit-logs", icon: History, label: "監査ログ" },
    { href: "/exports", icon: Archive, label: "月次処理" },
  ];

  const role = user?.role?.toLowerCase()?.trim() || "";
  const isLeaderOrHigher = ["admin", "manager", "leader"].includes(role);
  const isAdminOrManager = ["admin", "manager"].includes(role);

  return (
    <div className="grid gap-2 text-base">
      <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">一般ユーザー</div>
      {userNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
            pathname === item.href && "text-foreground font-semibold"
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
      {isLeaderOrHigher && (
        <>
          <div className="mt-4 px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">リーダー</div>
          <Link
            href="/project-assignments"
            onClick={onClose}
            className={cn(
              "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
              pathname?.startsWith("/project-assignments") && "text-foreground font-semibold"
            )}
          >
            <Briefcase className="h-5 w-5" />
            担当プロジェクト登録
          </Link>
        </>
      )}
      {isAdminOrManager && (
        <>
          <div className="mt-4 px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">管理業務</div>
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                pathname?.startsWith(item.href) && "text-foreground font-semibold"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </>
      )}
      <div className="mt-8 pt-4 border-t border-sidebar-border" onClick={onClose}>
        <UserMenu />
      </div>
    </div>
  );
}
