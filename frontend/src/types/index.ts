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
    role?: string;
    department_id?: string | null;
    department?: Department;
    work_rule_id?: string | null;
    cognito_sub?: string;
}

export interface Attendance {
    id: string;
    user_id: string;
    work_date: string; // ISO yyyy-MM-dd
    clock_in: string | null; // ISO datetime
    clock_out: string | null; // ISO datetime
    status: string;
    total_work_minutes: number | null;
    breaks?: any[];
}

export interface Shift {
    id: string;
    user_id: string;
    target_date: string;
    start_time: string | null;
    end_time: string | null;
    shift_type: string;
    is_holiday: boolean;
    remarks?: string;
    status?: string;
}

export interface Application {
    id: string;
    user_id: string;
    type: string;
    status: string;
    input_data: any;
    approver_id: string | null;
    created_at: string;
}

export interface ShiftTemplate {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
}
