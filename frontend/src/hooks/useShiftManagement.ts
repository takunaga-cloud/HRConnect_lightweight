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
        if (!isAuthenticated) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/users/")
            if (res.ok) {
                setUsers(await res.json())
            }
        } catch (e) {
            console.error(e)
        }
    }, [isAuthenticated])

    const fetchTemplates = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shift-templates/")
            if (res.ok) {
                setTemplates(await res.json())
            }
        } catch (e) { console.error(e); }
    }, [isAuthenticated])

    const fetchShifts = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true)
        const start = format(startOfMonth(currentDate), "yyyy-MM-dd")
        const end = format(endOfMonth(currentDate), "yyyy-MM-dd")
        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/?start_date=" + start + "&end_date=" + end);
            if (res.ok) {
                setShifts(await res.json());
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false) }
    }, [isAuthenticated, currentDate])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
            fetchTemplates()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchUsers, fetchTemplates])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShifts()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchShifts])

    return {
        shifts,
        users,
        templates,
        currentDate,
        setCurrentDate,
        isLoading,
        fetchShifts,
        fetchTemplates
    }
}
