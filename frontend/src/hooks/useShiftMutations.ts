import { useState, useRef } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { BACKEND_URL } from "@/lib/constants"

export const useShiftMutations = (isAuthenticated: boolean, onSuccess: () => void) => {
    // --- Batch Delete Local State ---
    const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
    const [batchDeleteTargetIds, setBatchDeleteTargetIds] = useState<string[]>([])
    const [batchDeleteStart, setBatchDeleteStart] = useState(format(startOfMonth(new Date()), "yyyy/MM/dd"))
    const [batchDeleteEnd, setBatchDeleteEnd] = useState(format(endOfMonth(new Date()), "yyyy/MM/dd"))

    // CSV Upload State
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handlers
    const handleDeleteShift = async (id: string) => {
        if (!confirm("シフトを削除しますか？")) return
        if (!isAuthenticated) return

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/" + id, {
                method: "DELETE"
            })
            if (res.ok) {
                onSuccess()
            } else {
                console.error(await res.text())
                alert("削除に失敗しました")
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleBatchDelete = async () => {
        if (!isAuthenticated) return
        if (batchDeleteTargetIds.length === 0) {
            alert("対象の従業員を選択してください")
            return
        }
        if (!confirm("指定した期間・条件のシフトを完全に削除します。よろしいですか？")) return

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/batch-delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_ids: batchDeleteTargetIds,
                    start_date: batchDeleteStart.replace(/\//g, "-"),
                    end_date: batchDeleteEnd.replace(/\//g, "-")
                })
            })
            if (res.ok) {
                alert("指定したシフトを削除しました")
                setIsBatchDeleteOpen(false)
                onSuccess()
            } else {
                alert("削除に失敗しました")
            }
        } catch (e) { console.error(e) }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !isAuthenticated) return

        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch(BACKEND_URL + "/api/v1/shifts/upload-csv", {
                method: "POST",
                body: formData
            })
            if (res.ok) {
                alert("CSVをアップロードしました")
                onSuccess()
            } else {
                const text = await res.text()
                alert("アップロード失敗: " + text)
            }
        } catch (err) {
            console.error(err)
            alert("エラーが発生しました")
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    return {
        handleDeleteShift,
        isBatchDeleteOpen, setIsBatchDeleteOpen,
        batchDeleteTargetIds, setBatchDeleteTargetIds,
        batchDeleteStart, setBatchDeleteStart,
        batchDeleteEnd, setBatchDeleteEnd,
        handleBatchDelete,
        fileInputRef, handleFileUpload
    }
}
