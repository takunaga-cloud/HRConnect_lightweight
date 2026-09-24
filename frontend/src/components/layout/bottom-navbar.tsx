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

function NavItem({ href, icon: Icon, label, isCurrent }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 p-2 text-xs font-medium text-gray-500 hover:text-gray-900",
        isCurrent && "text-gray-900",
        "dark:text-gray-400 dark:hover:text-gray-50",
        isCurrent && "dark:text-gray-50"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "ホーム" },
    { href: "/stamp", icon: Clock, label: "打刻" },
    { href: "/daily-report", icon: FileText, label: "日報" },
    { href: "/applications", icon: CalendarCheck, label: "申請" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white shadow-lg lg:hidden dark:bg-gray-950 dark:border-gray-800">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} isCurrent={pathname === item.href} />
        ))}
      </nav>
    </div>
  );
}
