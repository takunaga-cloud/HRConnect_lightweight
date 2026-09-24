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
    <div className="flex min-h-screen w-full flex-col bg-muted/40 max-w-full overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={cn(
        "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 min-w-0 w-full max-w-full overflow-x-hidden",
        isSidebarCollapsed ? "sm:pl-16" : "sm:pl-14 lg:pl-60"
      )}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:hidden w-full max-w-full min-w-0">
          <MobileSidebarTrigger />
          <div className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="HR-Connect Logo" className="h-6 w-6" />
            <span>HR-Connect</span>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background/50 lg:pb-4 pb-20 min-w-0 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNavbar />
    </div>
  );
}
