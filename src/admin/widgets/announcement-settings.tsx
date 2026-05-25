import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Switch, Input, Button, Text, Label, Toaster, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminStore } from "@medusajs/framework/types"

// Type for announcement bar configuration
interface AnnouncementBarConfig {
    enabled: boolean
    message: string
    link: string
}

// Widget component
const AnnouncementSettingsWidget = ({ data }: DetailWidgetProps<AdminStore>) => {
    const [config, setConfig] = useState<AnnouncementBarConfig>({
        enabled: false,
        message: "",
        link: "",
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    // Load current config from store metadata
    useEffect(() => {
        if (data?.metadata?.announcement_bar) {
            const announcementBar = data.metadata.announcement_bar as AnnouncementBarConfig
            setConfig({
                enabled: announcementBar.enabled ?? false,
                message: announcementBar.message ?? "",
                link: announcementBar.link ?? "",
            })
        }
    }, [data])

    // Handle form changes
    const handleChange = (field: keyof AnnouncementBarConfig, value: string | boolean) => {
        setConfig((prev) => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    // Save changes via Admin API
    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch(`/admin/stores/${data.id}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    metadata: {
                        ...data.metadata,
                        announcement_bar: config,
                    },
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to save announcement settings")
            }

            toast.success("Announcement Bar", {
                description: "Settings saved successfully!",
            })
            setIsDirty(false)
        } catch (error) {
            console.error("Error saving announcement settings:", error)
            toast.error("Error", {
                description: "Failed to save announcement settings. Please try again.",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <Heading level="h2">Announcement Bar</Heading>
                    <Text className="text-ui-fg-subtle" size="small">
                        Configure the top banner displayed on your storefront
                    </Text>
                </div>
            </div>

            <div className="px-6 py-4 space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="announcement-enabled" weight="plus">Enable Announcement Bar</Label>
                        <Text className="text-ui-fg-subtle" size="small">
                            Show or hide the banner on your store
                        </Text>
                    </div>
                    <Switch
                        id="announcement-enabled"
                        checked={config.enabled}
                        onCheckedChange={(checked) => handleChange("enabled", checked)}
                    />
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                    <Label htmlFor="announcement-message" weight="plus">Message</Label>
                    <Input
                        id="announcement-message"
                        placeholder="e.g., Free shipping on orders over £50!"
                        value={config.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                    />
                    <Text className="text-ui-fg-subtle" size="small">
                        The text displayed in the announcement bar
                    </Text>
                </div>

                {/* Link Input */}
                <div className="space-y-2">
                    <Label htmlFor="announcement-link" weight="plus">Link (optional)</Label>
                    <Input
                        id="announcement-link"
                        placeholder="e.g., /shop or /sale"
                        value={config.link}
                        onChange={(e) => handleChange("link", e.target.value)}
                    />
                    <Text className="text-ui-fg-subtle" size="small">
                        Click destination URL. Leave empty for non-clickable banner.
                    </Text>
                </div>

                {/* Preview */}
                {config.enabled && config.message && (
                    <div className="space-y-2">
                        <Label weight="plus">Preview</Label>
                        <div className="bg-charcoal text-white text-center py-2 px-4 rounded text-sm">
                            {config.message}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="pt-4">
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        disabled={!isDirty}
                        className="w-full"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Toaster />
        </Container>
    )
}

// Widget configuration - inject into Store settings
export const config = defineWidgetConfig({
    zone: "store.details.after",
})

export default AnnouncementSettingsWidget
