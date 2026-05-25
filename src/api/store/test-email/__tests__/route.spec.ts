
import { POST } from "../route"
import { Modules } from "@medusajs/framework/utils"

describe("POST /store/test-email", () => {
  const notificationServiceMock = {
    createNotifications: jest.fn(),
  }

  const reqMock = {
    scope: {
      resolve: jest.fn((key) => {
        if (key === Modules.NOTIFICATION) return notificationServiceMock
        return {}
      }),
    },
    body: {
      email: "test@example.com",
      first_name: "Test",
    },
  } as any

  const resMock = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return 400 if email is missing", async () => {
    const req = { ...reqMock, body: {} }
    await POST(req, resMock)
    expect(resMock.status).toHaveBeenCalledWith(400)
  })

  it("should send email and return 200", async () => {
    await POST(reqMock, resMock)

    expect(notificationServiceMock.createNotifications).toHaveBeenCalledWith(expect.objectContaining({
        to: "test@example.com",
        template: "customer_created"
    }))
    expect(resMock.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Test email triggered successfully" }))
  })

  it("should return 500 if service fails", async () => {
    notificationServiceMock.createNotifications.mockRejectedValue(new Error("Service fail"))
    await POST(reqMock, resMock)
    expect(resMock.status).toHaveBeenCalledWith(500)
  })
})
