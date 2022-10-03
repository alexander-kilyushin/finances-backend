import { IFinanceRecord } from "#interfaces/finance"

import { authorize } from "#e2e/helpers/authorize"
import { fetchApi } from "#e2e/helpers/fetchApi"

describe("Finance record deleting", () => {
  it("returns a correct response after deleting", async () => {
    await authorize("jessica-stark")
    const recordDeletingResponse = await fetchApi("/api/finances/records/5", { method: "DELETE" })
    expect(recordDeletingResponse.status).toEqual(200)
    expect(await recordDeletingResponse.json()).toEqual<IFinanceRecord>({
      amount: 10,
      category: {
        board: { id: 2, name: "mega-economists" },
        id: 3,
        name: "gifts",
        type: { id: 1, name: "expense" },
      },
      date: "2022-08-02",
      id: 5,
      isTrashed: false,
    })
  })

  it("the deleted records are not presented in all records list", async () => {
    await authorize("jessica-stark")
    await fetchApi("/api/finances/records/1", { method: "DELETE" })
    await fetchApi("/api/finances/records/2", { method: "DELETE" })
    await fetchApi("/api/finances/records/3", { method: "DELETE" })
    await fetchApi("/api/finances/records/6", { method: "DELETE" })
    const getAllRecordsResponse = await fetchApi("/api/finances/records/search")
    expect(await getAllRecordsResponse.json()).toEqual<IFinanceRecord[]>([
      {
        amount: 10,
        category: {
          board: { id: 2, name: "mega-economists" },
          id: 3,
          name: "gifts",
          type: { id: 1, name: "expense" },
        },
        date: "2022-08-02",
        id: 5,
        isTrashed: false,
      },
      {
        amount: 30,
        category: {
          board: { id: 2, name: "mega-economists" },
          id: 3,
          name: "gifts",
          type: { id: 1, name: "expense" },
        },
        date: "2022-08-02",
        id: 4,
        isTrashed: false,
      },
    ])
  })

  test("the user cannot delete a record of a board that they is not a member of", async () => {
    await authorize("john-doe")
    const recordUpdatingResponse = await fetchApi("/api/finances/records/5", { method: "DELETE" })
    expect(recordUpdatingResponse.status).toEqual(403)
    expect(await recordUpdatingResponse.json()).toEqual({ message: "Access denied." })
  })
})
