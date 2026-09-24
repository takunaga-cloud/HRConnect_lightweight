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

export function UserMenu({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const auth = useAuth()
  const user = auth?.user
  const isAuthenticated = auth?.isAuthenticated
  const loading = auth?.loading
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <div className="animate-pulse rounded-full h-8 w-8 bg-gray-200 dark:bg-gray-700"></div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" onClick={() => router.push("/login")} className={isCollapsed ? "w-8 h-8 p-0" : ""}>
        {isCollapsed ? <LogOut className="h-4 w-4" /> : "ログイン"}
      </Button>
    );
  }

  const displayName = user.username || user.name || "ユーザー";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={isCollapsed ? "relative h-10 w-10 rounded-full" : "flex items-center gap-3 w-full justify-start px-2 h-12"}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} alt="@user" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium truncate w-full">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "top"} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
