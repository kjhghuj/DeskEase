
import { GET } from "../route"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("GET /store/products/:id", () => {
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
      id: "prod_12345678-1234-1234-1234-1234567890ab", // Valid UUID
    },
  } as any

  const resMock = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return 400 if product ID is invalid format", async () => {
    const req = { ...reqMock, params: { id: "invalid space" } }
    await GET(req, resMock)
    expect(resMock.status).toHaveBeenCalledWith(400)
    expect(resMock.json).toHaveBeenCalledWith({ error: "Invalid product ID or handle format" })
  })

  it("should return 404 if product not found", async () => {
    queryMock.graph.mockResolvedValue({ data: [] })
    await GET(reqMock, resMock)
    expect(resMock.status).toHaveBeenCalledWith(404)
    expect(resMock.json).toHaveBeenCalledWith({ error: "Product not found" })
  })

  it("should return 200 and product if found by ID", async () => {
    const mockProduct = { id: reqMock.params.id, title: "Test Product" }
    queryMock.graph.mockResolvedValue({ data: [mockProduct] })

    await GET(reqMock, resMock)

    expect(queryMock.graph).toHaveBeenCalledWith(expect.objectContaining({
        filters: expect.objectContaining({
            $or: expect.arrayContaining([{ id: reqMock.params.id }, { handle: reqMock.params.id }])
        })
    }))
    expect(resMock.json).toHaveBeenCalledWith({ product: mockProduct })
  })

  it("should return 200 and product if found by Handle", async () => {
    const handle = "valid-handle"
    const req = { ...reqMock, params: { id: handle } }
    const mockProduct = { id: "prod_uuid", handle: handle, title: "Test Product" }
    queryMock.graph.mockResolvedValue({ data: [mockProduct] })

    await GET(req, resMock)

    expect(resMock.json).toHaveBeenCalledWith({ product: mockProduct })
  })
})
