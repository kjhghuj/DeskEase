
import { GET } from "../route"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("GET /store/carts/:id", () => {
  const queryMock = {
    graph: jest.fn(),
  }

  const reqMock = {
    scope: {
      resolve: jest.fn((key) => {
        if (key === ContainerRegistrationKeys.QUERY) {
          return queryMock
        }
        return {}
      }),
    },
    params: {
      id: "cart_123",
    },
  } as any

  const resMock = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return 400 if cart ID is missing", async () => {
    const req = { ...reqMock, params: {} }
    await GET(req, resMock)

    expect(resMock.status).toHaveBeenCalledWith(400)
    expect(resMock.json).toHaveBeenCalledWith({ error: "Cart ID is required" })
  })

  it("should return 404 if cart is not found", async () => {
    queryMock.graph.mockResolvedValue({ data: [] })

    await GET(reqMock, resMock)

    expect(queryMock.graph).toHaveBeenCalled()
    expect(resMock.status).toHaveBeenCalledWith(404)
    expect(resMock.json).toHaveBeenCalledWith({ error: "Cart not found" })
  })

  it("should return 404 if cart is already completed", async () => {
    queryMock.graph.mockResolvedValue({
      data: [
        {
          id: "cart_123",
          completed_at: new Date(),
        },
      ],
    })

    await GET(reqMock, resMock)

    expect(resMock.status).toHaveBeenCalledWith(404)
    expect(resMock.json).toHaveBeenCalledWith({ error: "Cart is already completed" })
  })

  it("should return 200 and the cart if valid", async () => {
    const mockCart = {
      id: "cart_123",
      email: "test@example.com",
    }
    queryMock.graph.mockResolvedValue({
      data: [mockCart],
    })

    await GET(reqMock, resMock)

    expect(resMock.status).not.toHaveBeenCalledWith(404) // Should default to 200 usually, or just json
    expect(resMock.json).toHaveBeenCalledWith({ cart: mockCart })
  })
})
