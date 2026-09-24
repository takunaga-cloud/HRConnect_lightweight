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
    const [loading, setLoading] = useState(true)

    const fetchUsers = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/users/`)
            if (res.ok) {
                setUsers(await res.json())
            }
        } catch (error) {
            console.error(error)
        }
    }, [isAuthenticated])

    const fetchAttendances = useCallback(async () => {
        if (!isAuthenticated) return
        setLoading(true)
        try {
            const start = format(startOfMonth(currentDate), "yyyy-MM-dd")
            const end = format(endOfMonth(currentDate), "yyyy-MM-dd")
            let url = `${BACKEND_URL}/api/v1/attendances/?start_date=${start}&end_date=${end}`
            if (selectedUser !== "all") {
                url += `&user_id=${selectedUser}`
            }

            const res = await fetch(url)

            if (res.ok) {
                setAttendances(await res.json())
            }
        } catch (error) {
            console.error(error)
            toast.error(UI_TEXT.TOAST.FETCH_ERROR, { description: UI_TEXT.ADMIN.FAILED_TO_FETCH_ATTENDANCE })
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated, currentDate, selectedUser])

    const deleteAttendance = async (attendanceId: string) => {
        if (!isAuthenticated) return
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/attendances/${attendanceId}`, {
                method: "DELETE"
            })

            if (res.ok) {
                toast.success(UI_TEXT.TOAST.DELETE_SUCCESS, { description: "打刻データを削除しました。" })
                fetchAttendances()
            } else {
                throw new Error("Failed to delete")
            }
        } catch (error) {
            console.error(error)
            toast.error(UI_TEXT.TOAST.DELETE_ERROR, { description: UI_TEXT.ADMIN.FAILED_TO_DELETE_ATTENDANCE })
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchUsers])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAttendances()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchAttendances])

    return {
        attendances,
        users,
        currentDate,
        setCurrentDate,
        selectedUser,
        setSelectedUser,
        loading,
        deleteAttendance,
        getUserName: (userId: string) => {
            const user = users.find((u) => u.id === userId || u.cognito_sub === userId)
            return user ? `${user.user_id || ''} ${user.name}` : userId
        }
    }
}
