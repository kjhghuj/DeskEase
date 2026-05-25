import { AbstractNotificationProviderService } from "@medusajs/utils"
import { Resend } from "resend"

type ResendOptions = {
  apiKey: string
  from: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatMoney(amount: unknown, currency: unknown): string {
  const numericAmount = typeof amount === "number" ? amount : 0
  const currencyCode = String(currency || "USD").toUpperCase()

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(numericAmount / 100)
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend-notification"
  protected resend: Resend
  protected options: ResendOptions

  constructor({ logger }, options: ResendOptions) {
    if (!options.apiKey) {
      throw new Error("[Resend Notification Provider] RESEND_API_KEY is required")
    }

    super()
    this.resend = new Resend(options.apiKey)
    this.options = options
  }

  async send(notification: any): Promise<{
    id: string
    to: string
    status: string
    data: Record<string, unknown>
  }> {
    const from = this.options.from || "orders@example.com"
    const { to, template, data = {} } = notification
    const frontendUrl =
      process.env.STOREFRONT_URL || process.env.FRONTEND_URL || "http://localhost:3030"

    if (!to) {
      throw new Error("No 'to' address provided for notification")
    }

    if (!EMAIL_REGEX.test(to)) {
      throw new Error("Invalid email address format")
    }

    const firstName = escapeHtml(data.first_name || "there")
    const fullOrderId = String(data.id || data.display_id || "N/A")
    const orderId = fullOrderId.startsWith("order_")
      ? fullOrderId.substring(6)
      : fullOrderId
    const currencyCode = String(data.currency_code || "USD").toUpperCase()

    let subject = "DeskEase notification"
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #17211F;">
        <h1 style="font-size: 26px; letter-spacing: 0.08em;">DeskEase</h1>
        <p>Hello ${firstName},</p>
        <p>Your DeskEase notification is ready.</p>
      </div>
    `

    if (template === "customer_created") {
      subject = "Welcome to DeskEase"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #17211F; background: #ffffff; padding: 32px;">
          <h1 style="font-size: 26px; letter-spacing: 0.08em;">DeskEase</h1>
          <p>Hello ${firstName},</p>
          <p>Your optional DeskEase account has been created. Guest checkout remains available whenever you prefer a faster purchase path.</p>
          <p><a href="${frontendUrl}/account" style="color: #3F6F65;">View account</a></p>
        </div>
      `
    }

    if (template === "order_placed") {
      subject = `DeskEase order confirmation #${orderId}`
      const items = Array.isArray(data.items) ? data.items : []
      const itemsHtml = items
        .map((item: any) => {
          const itemName = escapeHtml(item.title || item.product_title || "DeskEase item")
          const itemQty = Number(item.quantity || 1)
          const itemTotal = formatMoney((item.unit_price || 0) * itemQty, currencyCode)

          return `
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #E6ECE2;">
                <strong>${itemName}</strong><br />
                <span style="color: #5D6964;">Qty ${itemQty}</span>
              </td>
              <td align="right" style="padding: 14px 0; border-bottom: 1px solid #E6ECE2;">${itemTotal}</td>
            </tr>
          `
        })
        .join("")

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #17211F; background: #ffffff; padding: 32px;">
          <h1 style="font-size: 26px; letter-spacing: 0.08em;">DeskEase</h1>
          <p style="color: #5D6964; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px;">Order #${escapeHtml(orderId)}</p>
          <h2 style="font-size: 28px; margin: 0 0 16px;">Thanks, ${firstName}. Your order is confirmed.</h2>
          <p style="line-height: 1.7; color: #5D6964;">
            We are preparing your DeskEase order. Standard US delivery is expected in 7-12 business days after dispatch.
          </p>
          ${
            itemsHtml
              ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; border-top: 1px solid #E6ECE2;">${itemsHtml}</table>`
              : ""
          }
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            <tr>
              <td style="padding: 6px 0; color: #5D6964;">Subtotal</td>
              <td align="right">${formatMoney(data.subtotal || data.total || 0, currencyCode)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #5D6964;">Shipping</td>
              <td align="right">${formatMoney(data.shipping_total || 0, currencyCode)}</td>
            </tr>
            <tr>
              <td style="padding-top: 14px; font-size: 18px; font-weight: 700; border-top: 1px solid #E6ECE2;">Total</td>
              <td align="right" style="padding-top: 14px; font-size: 18px; font-weight: 700; border-top: 1px solid #E6ECE2;">${formatMoney(data.total || 0, currencyCode)}</td>
            </tr>
          </table>
          <p style="margin-top: 28px;">
            <a href="${frontendUrl}/order/lookup?order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(data.email || "")}" style="display: inline-block; background: #17211F; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 999px;">
              View order
            </a>
          </p>
          <p style="font-size: 12px; color: #7B857F; margin-top: 28px;">
            DeskEase products are consumer comfort products and are not medical devices.
          </p>
        </div>
      `
    }

    const { data: result, error } = await this.resend.emails.send({
      from,
      to,
      subject,
      html,
      reply_to: process.env.SUPPORT_EMAIL || from,
    } as any)

    if (error) {
      console.error("[Resend] Email send failed:", error.message || "Unknown error")
      throw new Error("Failed to send email notification")
    }

    return {
      id: result?.id || "",
      to,
      status: "sent",
      data: result as unknown as Record<string, unknown>,
    }
  }
}

export default ResendNotificationProviderService
