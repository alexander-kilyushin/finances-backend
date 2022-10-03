import { IFinanceRecord } from "#interfaces/finance"

import { financeRecords } from "#e2e/constants/finances"
import { users } from "#e2e/constants/users"
import { authorize } from "#e2e/helpers/authorize"
import { fetchApi } from "#e2e/helpers/fetchApi"

describe("Finance record deleting", () => {
  it("returns a correct response after deleting", async () => {
    await authorize(users.jessicaStark.username)
    const recordDeletingResponse = await fetchApi(`/api/finances/records/${financeRecords["5th"].id}`, {
      method: "DELETE",
    })
    expect(recordDeletingResponse.status).toEqual(200)
    expect(await recordDeletingResponse.json()).toEqual<IFinanceRecord>(financeRecords["5th"])
  })

  it("the deleted records are not presented in all records list", async () => {
    await authorize(users.jessicaStark.username)
    await fetchApi(`/api/finances/records/${financeRecords["1st"].id}`, { method: "DELETE" })
    await fetchApi(`/api/finances/records/${financeRecords["2nd"].id}`, { method: "DELETE" })
    await fetchApi(`/api/finances/records/${financeRecords["3rd"].id}`, { method: "DELETE" })
    await fetchApi(`/api/finances/records/${financeRecords["6th"].id}`, { method: "DELETE" })
    const getAllRecordsResponse = await fetchApi("/api/finances/records/search")
    expect(await getAllRecordsResponse.json()).toEqual<IFinanceRecord[]>([financeRecords["5th"], financeRecords["4th"]])
  })

  test("the user cannot delete a record of a board that they is not a member of", async () => {
    await authorize(users.johnDoe.username)
    const recordUpdatingResponse = await fetchApi(`/api/finances/records/${financeRecords["5th"].id}`, {
      method: "DELETE",
    })
    expect(recordUpdatingResponse.status).toEqual(403)
    expect(await recordUpdatingResponse.json()).toEqual({ message: "Access denied." })
  })
})
