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
        setCurrentDate,
        selectedUser,
        setSelectedUser,
        loading,
        deleteAttendance,
        getUserName
    } = useAdminAttendances();

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl w-full min-w-0 max-w-full overflow-hidden">
            <PageHeader
                title={UI_TEXT.ADMIN.ATTENDANCE_MANAGEMENT}
                description={UI_TEXT.ADMIN.ATTENDANCE_DESC}
                icon={Clock}
            >
                <AttendanceFilter
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    users={users}
                />
            </PageHeader>

            <Card className="w-full min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-4 md:p-6">
                    <AttendanceTable
                        attendances={attendances}
                        loading={loading}
                        getUserName={getUserName}
                        onDelete={deleteAttendance}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
