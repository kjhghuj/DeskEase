
import { GET } from "../route"

describe("GET /store/custom", () => {
  const reqMock = {} as any
  const resMock = {
    sendStatus: jest.fn(),
  } as any

  it("should return 200", async () => {
    await GET(reqMock, resMock)
    expect(resMock.sendStatus).toHaveBeenCalledWith(200)
  })
})
