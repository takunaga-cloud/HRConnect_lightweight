"use client"

import { useState, useEffect } from "react"
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Plus, ToggleLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

type SystemDefinition = {
    id: string
    category_code: string
    code: string
    name: string
    order: number
    description?: string
}

export default function SystemDefinitionsPage() {
    const { isAuthenticated } = useAuth() || {}
    const [definitions, setDefinitions] = useState<SystemDefinition[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("PAID_LEAVE_TYPE")
    const [categories, setCategories] = useState<string[]>(["PAID_LEAVE_TYPE", "APPLICATION_TYPE"]) // Add more as discovered or allow manual entry

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<SystemDefinition | null>(null)
    const [formData, setFormData] = useState<Partial<SystemDefinition>>({
        category_code: "PAID_LEAVE_TYPE",
        code: "",
        name: "",
        order: 0,
        description: ""
    })

    const fetchDefinitions = async () => {
        setLoading(true)
        try {
            const url = selectedCategory
                ? `${BACKEND_URL}/api/v1/system-definitions/?category_code=${selectedCategory}`
                : `${BACKEND_URL}/api/v1/system-definitions/`

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json()
                setDefinitions(data)
                // Extract unique categories if we want to discover them dynamically
                // const uniqueCats = Array.from(new Set(data.map((d: any) => d.category_code)))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) fetchDefinitions()
    }, [isAuthenticated, selectedCategory])

    const handleSave = async () => {
        try {
            const url = editingItem
                ? `${BACKEND_URL}/api/v1/system-definitions/${editingItem.id}`
                : `${BACKEND_URL}/api/v1/system-definitions/`

            const method = editingItem ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setIsDialogOpen(false)
                fetchDefinitions()
                setEditingItem(null)
                setFormData({ category_code: selectedCategory, order: 0, code: "", name: "", description: "" })
            } else {
                alert("Failed to save")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？")) return

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/system-definitions/${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                fetchDefinitions()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const openEdit = (item: SystemDefinition) => {
        setEditingItem(item)
        setFormData(item)
        setIsDialogOpen(true)
    }

    const openCreate = () => {
        setEditingItem(null)
        setFormData({ category_code: selectedCategory, order: 0, code: "", name: "", description: "" })
        setIsDialogOpen(true)
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
            <PageHeader
                title="システム設定"
                description="システム全体の動作フラグや通知に関する共通パラメータ（システム定義定義）を管理します。"
                icon={ToggleLeft}
            >
                <Button onClick={openCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> 新規登録
                </Button>
            </PageHeader>

            <div className="flex items-center gap-4">
                <Label>カテゴリフィルタ:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectItem value="ALL">全て</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>コード</TableHead>
                            <TableHead>名称</TableHead>
                            <TableHead>順序</TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {definitions.map((def) => (
                            <TableRow key={def.id}>
                                <TableCell>{def.category_code}</TableCell>
                                <TableCell>{def.code}</TableCell>
                                <TableCell>{def.name}</TableCell>
                                <TableCell>{def.order}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(def)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(def.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "定義編集" : "新規定義登録"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">カテゴリ</Label>
                            <Input
                                className="col-span-3"
                                value={formData.category_code}
                                onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">コード</Label>
                            <Input
                                className="col-span-3"
                                value={formData.code || ""}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">名称</Label>
                            <Input
                                className="col-span-3"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">順序</Label>
                            <Input
                                type="number"
                                className="col-span-3"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
