import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, Toaster, toast, Badge, clx } from "@medusajs/ui"
import { useState, useEffect, useRef, useCallback } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Photo, XMark, Plus } from "@medusajs/icons"

// ============================================================================
// Type Definitions
// ============================================================================

interface ProductImage {
    id: string
    url: string
}

interface ProductVariant {
    id: string
    title: string
    sku?: string
    metadata?: {
        images?: { url: string }[]
    }
}

// ============================================================================
// Custom Media Manager Widget
// ============================================================================

const ProductMediaManagerWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
    const [images, setImages] = useState<ProductImage[]>([])
    const [thumbnail, setThumbnail] = useState<string>("")
    const [variants, setVariants] = useState<ProductVariant[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showVariantSelector, setShowVariantSelector] = useState<string | null>(null)
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --------------------------------------------------------------------------
    // Load Data
    // --------------------------------------------------------------------------

    const loadProductData = useCallback(async () => {
        if (data) {
            console.log('[MediaManager] Loading product data:', data.id)
            setImages(data.images || [])
            setThumbnail(data.thumbnail || "")

            // Load variants
            try {
                const response = await fetch(`/admin/products/${data.id}/variants?limit=100`, {
                    credentials: 'include',
                })
                if (response.ok) {
                    const result = await response.json()
                    setVariants(result.variants || [])
                }
            } catch (error) {
                console.error('[MediaManager] Failed to load variants:', error)
            }
        }
    }, [data])

    useEffect(() => {
        loadProductData()
    }, [loadProductData])

    // --------------------------------------------------------------------------
    // Hide Native Media Section
    // --------------------------------------------------------------------------

    useEffect(() => {
        // 注入 CSS 样式强制隐藏
        const styleId = 'hide-native-media-style'
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style')
            style.id = styleId
            style.textContent = `
                [data-hide-native-media="true"] {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `
            document.head.appendChild(style)
        }

        // 隐藏原生媒体区域
        const hideNativeMedia = () => {
            const headings = document.querySelectorAll('h2')
            headings.forEach(heading => {
                const text = heading.textContent?.trim() || ''
                // 只匹配 "媒体" 但不匹配 "媒体管理"
                if (text === '媒体' || text === 'Media') {
                    let parent = heading.parentElement
                    for (let i = 0; i < 8 && parent; i++) {
                        // 跳过已处理的
                        if (parent.getAttribute('data-hide-native-media') === 'true') return

                        const cls = parent.className || ''
                        // 找到带有 shadow 或 rounded 的容器
                        if (cls.includes('shadow') || cls.includes('rounded-lg')) {
                            parent.setAttribute('data-hide-native-media', 'true')
                            console.log('[MediaManager] Hidden native media section')
                            return
                        }
                        parent = parent.parentElement
                    }
                }
            })
        }

        // 多次执行以确保隐藏
        const t1 = setTimeout(hideNativeMedia, 100)
        const t2 = setTimeout(hideNativeMedia, 300)
        const t3 = setTimeout(hideNativeMedia, 600)
        const t4 = setTimeout(hideNativeMedia, 1000)

        // 监听 DOM 变化
        const observer = new MutationObserver(() => setTimeout(hideNativeMedia, 50))
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
            observer.disconnect()
        }
    }, [])

    // --------------------------------------------------------------------------
    // Refresh Product Data
    // --------------------------------------------------------------------------

    const refreshProductData = async () => {
        try {
            const response = await fetch(`/admin/products/${data.id}`, {
                credentials: 'include',
            })
            if (response.ok) {
                const result = await response.json()
                if (result.product) {
                    setImages(result.product.images || [])
                    setThumbnail(result.product.thumbnail || "")
                    console.log('[MediaManager] Data refreshed')
                }
            }
        } catch (error) {
            console.error('[MediaManager] Failed to refresh data:', error)
        }
    }

    // --------------------------------------------------------------------------
    // Upload Handler
    // --------------------------------------------------------------------------

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)

        try {
            const formData = new FormData()
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i])
            }

            const uploadResponse = await fetch('/admin/uploads', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!uploadResponse.ok) throw new Error('Upload failed')

            const uploadResult = await uploadResponse.json()
            const uploadedImages = uploadResult.files || []

            const newImages = [
                ...images.map(img => ({ url: img.url })),
                ...uploadedImages.map((file: { url: string }) => ({ url: file.url }))
            ]

            const updateResponse = await fetch(`/admin/products/${data.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: newImages }),
            })

            if (!updateResponse.ok) throw new Error('Failed to update product')

            await refreshProductData()
            toast.success("上传成功", { description: `已上传 ${uploadedImages.length} 张图片` })

        } catch (error) {
            console.error('[MediaManager] Upload error:', error)
            toast.error("上传失败")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // --------------------------------------------------------------------------
    // Delete Handler
    // --------------------------------------------------------------------------

    const handleDeleteImage = async (imageUrl: string) => {
        setIsDeleting(imageUrl)

        try {
            const fileKey = extractFileKeyFromUrl(imageUrl)
            const newImages = images.filter(img => img.url !== imageUrl).map(img => ({ url: img.url }))
            const newThumbnail = thumbnail === imageUrl ? "" : undefined

            const updatePayload: { images: { url: string }[]; thumbnail?: string } = { images: newImages }
            if (newThumbnail !== undefined) updatePayload.thumbnail = newThumbnail

            const updateResponse = await fetch(`/admin/products/${data.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            })

            if (!updateResponse.ok) throw new Error('Failed to update product')

            if (fileKey) {
                await fetch('/admin/delete-file', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileKey }),
                }).catch(() => { })
            }

            await refreshProductData()
            toast.success("删除成功")

        } catch (error) {
            console.error('[MediaManager] Delete error:', error)
            toast.error("删除失败")
        } finally {
            setIsDeleting(null)
        }
    }

    // --------------------------------------------------------------------------
    // Batch Delete Handler
    // --------------------------------------------------------------------------

    const handleBatchDelete = async () => {
        if (selectedImages.size === 0) return

        setIsDeleting('batch')
        const urlsToDelete = Array.from(selectedImages)

        try {
            // Filter out selected images
            const newImages = images
                .filter(img => !selectedImages.has(img.url))
                .map(img => ({ url: img.url }))

            // Check if thumbnail is being deleted
            const newThumbnail = selectedImages.has(thumbnail) ? "" : undefined
            const updatePayload: { images: { url: string }[]; thumbnail?: string } = { images: newImages }
            if (newThumbnail !== undefined) updatePayload.thumbnail = newThumbnail

            const updateResponse = await fetch(`/admin/products/${data.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            })

            if (!updateResponse.ok) throw new Error('Failed to update product')

            // Delete files from R2
            for (const url of urlsToDelete) {
                const fileKey = extractFileKeyFromUrl(url)
                if (fileKey) {
                    await fetch('/admin/delete-file', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileKey }),
                    }).catch(() => { })
                }
            }

            setSelectedImages(new Set())
            await refreshProductData()
            toast.success("批量删除成功", { description: `已删除 ${urlsToDelete.length} 张图片` })

        } catch (error) {
            console.error('[MediaManager] Batch delete error:', error)
            toast.error("批量删除失败")
        } finally {
            setIsDeleting(null)
        }
    }

    // Toggle image selection
    const toggleImageSelection = (imageUrl: string) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev)
            if (newSet.has(imageUrl)) {
                newSet.delete(imageUrl)
            } else {
                newSet.add(imageUrl)
            }
            return newSet
        })
    }

    // Select/deselect all
    const toggleSelectAll = () => {
        if (selectedImages.size === images.length) {
            setSelectedImages(new Set())
        } else {
            setSelectedImages(new Set(images.map(img => img.url)))
        }
    }

    // --------------------------------------------------------------------------
    // Set Thumbnail Handler
    // --------------------------------------------------------------------------

    const handleSetThumbnail = async (imageUrl: string) => {
        setIsSaving(true)
        try {
            const response = await fetch(`/admin/products/${data.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thumbnail: imageUrl }),
            })
            if (!response.ok) throw new Error('Failed to set thumbnail')
            setThumbnail(imageUrl)
            toast.success("缩略图已设置")
        } catch (error) {
            toast.error("设置失败")
        } finally {
            setIsSaving(false)
        }
    }

    // --------------------------------------------------------------------------
    // Set Variant Image Handler
    // --------------------------------------------------------------------------

    const handleSetVariantImage = async (imageUrl: string, variantId: string) => {
        setIsSaving(true)
        try {
            const variant = variants.find(v => v.id === variantId)

            // 覆盖模式：一个变体只能关联一张图片
            const newImages = [{ url: imageUrl }]

            const response = await fetch(`/admin/products/${data.id}/variants/${variantId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metadata: {
                        ...variant?.metadata,
                        images: newImages
                    }
                }),
            })

            if (!response.ok) throw new Error('Failed to update variant')

            // Update local state
            setVariants(prev => prev.map(v =>
                v.id === variantId
                    ? { ...v, metadata: { ...v.metadata, images: newImages } }
                    : v
            ))

            toast.success("已关联到变体", { description: variant?.title || variantId })
        } catch (error) {
            console.error('[MediaManager] Set variant image error:', error)
            toast.error("设置失败")
        } finally {
            setIsSaving(false)
            setShowVariantSelector(null)
        }
    }

    // --------------------------------------------------------------------------
    // Utility
    // --------------------------------------------------------------------------

    const extractFileKeyFromUrl = (url: string): string | null => {
        try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname
            return pathname.startsWith('/') ? pathname.slice(1) : pathname
        } catch {
            return null
        }
    }

    const getVariantCountForImage = (imageUrl: string): number => {
        return variants.filter(v =>
            (v.metadata?.images as { url: string }[] | undefined)?.some(img => img.url === imageUrl)
        ).length
    }

    // --------------------------------------------------------------------------
    // Render
    // --------------------------------------------------------------------------

    return (
        <Container className="divide-y p-0">
            <Toaster />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Photo className="text-ui-fg-subtle w-4 h-4" />
                    <Heading level="h2">媒体管理</Heading>
                    <Badge color="blue" size="xsmall">{images.length}</Badge>
                    {selectedImages.size > 0 && (
                        <Badge color="orange" size="xsmall">已选 {selectedImages.size}</Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    {images.length > 0 && (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={toggleSelectAll}
                        >
                            {selectedImages.size === images.length ? '取消全选' : '全选'}
                        </Button>
                    )}
                    {selectedImages.size > 0 && (
                        <Button
                            variant="danger"
                            size="small"
                            onClick={handleBatchDelete}
                            disabled={isDeleting === 'batch'}
                        >
                            {isDeleting === 'batch' ? '删除中...' : `删除 (${selectedImages.size})`}
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Plus className="w-3 h-3 mr-1" />{isUploading ? '上传中...' : '上传'}
                    </Button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Image Grid */}
            <div className="px-4 pb-4">
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-ui-fg-subtle">
                        <Photo className="w-8 h-8 mb-2" />
                        <Text size="small">暂无图片</Text>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {images.map((image) => (
                            <div
                                key={image.id || image.url}
                                className={clx(
                                    "relative group rounded overflow-hidden border transition-all cursor-pointer",
                                    selectedImages.has(image.url)
                                        ? "border-blue-500 border-2 ring-2 ring-blue-200"
                                        : thumbnail === image.url
                                            ? "border-ui-fg-interactive border-2"
                                            : "border-ui-border-base hover:border-ui-border-strong"
                                )}
                                onClick={() => toggleImageSelection(image.url)}
                            >
                                <div className="aspect-square bg-ui-bg-subtle">
                                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                                </div>

                                {/* Selection checkbox */}
                                <div className="absolute top-1 right-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedImages.has(image.url)}
                                        onChange={() => toggleImageSelection(image.url)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-500 cursor-pointer"
                                    />
                                </div>

                                {/* Badges */}
                                <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                                    {thumbnail === image.url && (
                                        <span className="bg-green-500 text-white text-[10px] px-1 rounded">T</span>
                                    )}
                                    {getVariantCountForImage(image.url) > 0 && (
                                        <span className="bg-purple-500 text-white text-[10px] px-1 rounded">V{getVariantCountForImage(image.url)}</span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSetThumbnail(image.url); }}
                                        disabled={isSaving || thumbnail === image.url}
                                        className="w-full text-center py-1 px-1 bg-white/90 hover:bg-white rounded text-xs disabled:opacity-50"
                                    >
                                        缩略图
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowVariantSelector(image.url); }}
                                        disabled={isSaving}
                                        className="w-full text-center py-1 px-1 bg-white/90 hover:bg-white rounded text-xs"
                                    >
                                        变体
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.url); }}
                                        disabled={isDeleting === image.url}
                                        className="w-full text-center py-1 px-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs disabled:opacity-50"
                                    >
                                        {isDeleting === image.url ? '...' : '删除'}
                                    </button>
                                </div>

                                {showVariantSelector === image.url && (
                                    <div className="absolute inset-0 bg-white/95 flex flex-col p-2 z-10" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-1">
                                            <Text weight="plus" size="xsmall">选择变体</Text>
                                            <button onClick={(e) => { e.stopPropagation(); setShowVariantSelector(null); }} className="text-ui-fg-subtle hover:text-ui-fg-base">
                                                <XMark className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-1">
                                            {variants.length === 0 ? (
                                                <Text size="xsmall" className="text-ui-fg-subtle">无变体</Text>
                                            ) : (
                                                variants.map(variant => {
                                                    const linkedImage = (variant.metadata?.images as { url: string }[] | undefined)?.[0]
                                                    const isLinked = linkedImage?.url === image.url
                                                    const hasOtherImage = linkedImage && !isLinked
                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            onClick={(e) => { e.stopPropagation(); handleSetVariantImage(image.url, variant.id); }}
                                                            disabled={isSaving || isLinked}
                                                            className={clx(
                                                                "w-full text-left px-1 py-1 rounded text-xs transition-colors",
                                                                isLinked
                                                                    ? "bg-ui-bg-subtle-pressed text-ui-fg-disabled cursor-not-allowed"
                                                                    : "hover:bg-ui-bg-subtle"
                                                            )}
                                                        >
                                                            {variant.title}
                                                            {isLinked && <span className="ml-1 text-xs">(当前)</span>}
                                                            {hasOtherImage && <span className="ml-1 text-xs text-orange-500">(替换)</span>}
                                                        </button>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.before",
})

export default ProductMediaManagerWidget
