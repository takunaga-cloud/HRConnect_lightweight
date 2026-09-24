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
    return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl relative overflow-hidden border border-indigo-900/30 w-full max-w-full min-w-0">
            {/* グリッド背景の視覚効果 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 w-full min-w-0">
                <div className="space-y-1 w-full md:w-auto min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2 min-w-0">
                        {Icon && <Icon className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-indigo-400 shrink-0" />}
                        <span className="truncate">{title}</span>
                    </h1>
                    {description && (
                        <p className="text-indigo-200 text-xs md:text-sm max-w-2xl leading-snug md:leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                {/* 右側の追加要素（ボタンやセレクトボックス等）用スロット */}
                {children && (
                    <div className="w-full md:w-auto shrink-0 relative z-20 pt-1 md:pt-0 min-w-0 max-w-full">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
