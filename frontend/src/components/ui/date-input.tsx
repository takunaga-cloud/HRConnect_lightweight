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

/**
 * YYYY/MM/DD 形式で日付を入力・選択するための共通コンポーネント。
 * テキストの手入力（自動スラッシュ補完機能付き）と、カレンダーピッカー（非表示の input[type=date]）を同期させます。
 */
export function DateInput({
  value,
  onChange,
  placeholder,
  required,
  id,
  disabled,
  className = "",
}: DateInputProps) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Input
        type="text"
        id={id}
        placeholder={placeholder || "2026/06/02"}
        pattern="^\d{4}/\d{2}/\d{2}$"
        title="日付形式: YYYY/MM/DD (例: 2026/06/02)"
        required={required}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          let val = e.target.value;
          // スラッシュなしで8桁の数値（例: 20260602）が入力された場合、自動的にスラッシュを挿入する
          if (val.length === 8 && !val.includes("/")) {
            val = val.substring(0, 4) + "/" + val.substring(4, 6) + "/" + val.substring(6, 8);
          }
          onChange(val);
        }}
        className="pr-10 w-full"
      />
      <div className="absolute right-3 cursor-pointer text-gray-400 hover:text-gray-600 flex items-center justify-center w-5 h-5">
        <input
          type="date"
          className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="カレンダーで選択"
          value={value ? value.replace(/\//g, "-") : ""}
          disabled={disabled}
          onChange={(e) => {
            const dateVal = e.target.value;
            if (dateVal) {
              onChange(dateVal.replace(/-/g, "/"));
            }
          }}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
      </div>
    </div>
  );
}
