// src/admin/widgets/product-detail-editor.tsx

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, Toaster, toast, Input, Textarea, Label, IconButton } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Plus, Trash, ArrowUpMini, ArrowDownMini, Photo } from "@medusajs/icons"

// 定义数据结构，需与前端 StorySection 对应
interface StorySectionData {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imageAlt: string;
}

const ProductDetailStoryWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
    const [sections, setSections] = useState<StorySectionData[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

    // --------------------------------------------------------------------------
    // 1. 初始化数据
    // --------------------------------------------------------------------------
    useEffect(() => {
        // 从 metadata 中读取 story_sections，如果是旧数据(字符串)则忽略或需手动迁移
        if (data?.metadata?.story_sections) {
            try {
                // 确保它是数组
                const loadedSections = Array.isArray(data.metadata.story_sections)
                    ? data.metadata.story_sections
                    : JSON.parse(data.metadata.story_sections as string);
                setSections(loadedSections)
            } catch (e) {
                console.error("Failed to parse story sections", e)
                setSections([])
            }
        }
    }, [data])

    // --------------------------------------------------------------------------
    // 2. 操作逻辑 (增删改查)
    // --------------------------------------------------------------------------
    const handleAddSection = () => {
        const newSection: StorySectionData = {
            id: crypto.randomUUID(),
            title: "",
            content: "",
            imageUrl: "",
            imageAlt: ""
        }
        setSections([...sections, newSection])
        setIsDirty(true)
    }

    const handleRemoveSection = (index: number) => {
        const newSections = [...sections]
        newSections.splice(index, 1)
        setSections(newSections)
        setIsDirty(true)
    }

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === sections.length - 1) return

        const newSections = [...sections]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newSections[targetIndex]
        newSections[targetIndex] = newSections[index]
        newSections[index] = temp
        setSections(newSections)
        setIsDirty(true)
    }

    const updateSection = (index: number, field: keyof StorySectionData, value: string) => {
        const newSections = [...sections]
        newSections[index] = { ...newSections[index], [field]: value }
        setSections(newSections)
        setIsDirty(true)
    }

    // --------------------------------------------------------------------------
    // 3. 图片上传逻辑
    // --------------------------------------------------------------------------
    const extractFileKey = (url: string) => {
        try {
            const urlObj = new URL(url);
            // pathname usually starts with /, so slice(1) removes it
            // Adjust based on your R2 public URL structure
            // Example: https://pub-xxx.r2.dev/products/image.jpg -> products/image.jpg
            return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
        } catch (e) {
            console.error("Failed to parse URL for key extraction:", e);
            return null;
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingIndex(index)
        const file = files[0] // 每次只传一张作为封面
        const oldImageUrl = sections[index].imageUrl; // Capture old URL before update

        try {
            const formData = new FormData()
            formData.append('files', file)

            // 使用你现有的上传 API
            const response = await fetch('/admin/uploads', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!response.ok) throw new Error('Upload failed')

            const result = await response.json()
            const uploadedFile = result.files?.[0]

            if (uploadedFile?.url) {
                updateSection(index, 'imageUrl', uploadedFile.url)
                toast.success("图片上传成功")

                // If there was an old image, try to delete it
                if (oldImageUrl) {
                    const fileKey = extractFileKey(oldImageUrl);
                    if (fileKey) {
                        try {
                            const deleteRes = await fetch('/admin/delete-file', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ fileKey }),
                                credentials: 'include'
                            });
                            if (!deleteRes.ok) {
                                console.warn(`Failed to delete old image: ${fileKey}`);
                            } else {
                                console.log(`Deleted old image: ${fileKey}`);
                            }
                        } catch (delErr) {
                            console.error("Error deleting old image:", delErr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error("上传失败")
        } finally {
            setUploadingIndex(null)
            // 清空 input 允许重复上传同一文件
            if (fileInputRefs.current[index]) {
                fileInputRefs.current[index]!.value = ''
            }
        }
    }

    // --------------------------------------------------------------------------
    // 4. 保存逻辑
    // --------------------------------------------------------------------------
    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 保存为 JSON 对象数组
            const response = await fetch(`/admin/products/${data.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metadata: {
                        ...data.metadata,
                        story_sections: sections, // 直接存数组
                        // 清理旧字段以防混淆（可选）
                        detail_story: null
                    },
                }),
            })

            if (!response.ok) throw new Error('Save failed')
            toast.success("保存成功")
            setIsDirty(false)
        } catch (error) {
            console.error('Save error:', error)
            toast.error("保存失败")
        } finally {
            setIsSaving(false)
        }
    }

    // --------------------------------------------------------------------------
    // 渲染 UI
    // --------------------------------------------------------------------------
    return (
        <Container className="p-0 overflow-hidden">
            <Toaster />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base bg-ui-bg-subtle">
                <div className="flex items-center gap-2">
                    <Heading level="h2">产品故事模块</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                        ({sections.length} 个章节)
                    </Text>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={handleAddSection}
                    >
                        <Plus /> 添加章节
                    </Button>
                    <Button
                        variant="primary"
                        size="small"
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? "保存中..." : "保存更改"}
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4 p-6 bg-ui-bg-base">
                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-ui-fg-muted border-2 border-dashed border-ui-border-base rounded-lg">
                        <Text>暂无内容，点击右上角添加章节</Text>
                    </div>
                ) : (
                    sections.map((section, index) => (
                        <div key={section.id} className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-subtle shadow-sm transition-all hover:shadow-md">
                            <div className="flex gap-6">
                                {/* Left: Image Uploader */}
                                <div className="w-[240px] flex-shrink-0 flex flex-col gap-2">
                                    <div
                                        className="relative aspect-[4/3] bg-ui-bg-base border border-ui-border-base rounded-md overflow-hidden flex items-center justify-center cursor-pointer group"
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                    >
                                        {section.imageUrl ? (
                                            <>
                                                <img src={section.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Text size="small">更换图片</Text>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-ui-fg-muted">
                                                <Photo />
                                                <Text size="small" className="mt-2">点击上传图片</Text>
                                            </div>
                                        )}
                                        {uploadingIndex === index && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <Text size="small">上传中...</Text>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={el => fileInputRefs.current[index] = el}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileSelect(e, index)}
                                    />
                                    <div className="grid gap-1">
                                        <Label size="xsmall" className="text-ui-fg-muted">图片描述 (Alt)</Label>
                                        <Input
                                            size="small"
                                            placeholder="描述图片内容..."
                                            value={section.imageAlt}
                                            onChange={(e) => updateSection(index, 'imageAlt', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Right: Content Inputs */}
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label size="small" weight="plus">标题</Label>
                                        <Input
                                            placeholder="例如：精心打磨的工艺..."
                                            value={section.title}
                                            onChange={(e) => updateSection(index, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2 flex-1">
                                        <Label size="small" weight="plus">文案内容</Label>
                                        <Textarea
                                            placeholder="输入详细的故事文案..."
                                            rows={5}
                                            value={section.content}
                                            onChange={(e) => updateSection(index, 'content', e.target.value)}
                                            className="resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 border-l border-ui-border-base pl-4 justify-center">
                                    <IconButton
                                        variant="transparent"
                                        onClick={() => handleMove(index, 'up')}
                                        disabled={index === 0}
                                        aria-label="上移此章节"
                                    >
                                        <ArrowUpMini className="text-ui-fg-subtle" />
                                    </IconButton>
                                    <IconButton
                                        variant="transparent"
                                        onClick={() => handleMove(index, 'down')}
                                        disabled={index === sections.length - 1}
                                        aria-label="下移此章节"
                                    >
                                        <ArrowDownMini className="text-ui-fg-subtle" />
                                    </IconButton>
                                    <div className="h-px bg-ui-border-base my-1" />
                                    <IconButton
                                        variant="transparent"
                                        className="text-ui-fg-error hover:bg-ui-bg-error-hover"
                                        onClick={() => handleRemoveSection(index)}
                                    >
                                        <Trash />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

export default ProductDetailStoryWidget