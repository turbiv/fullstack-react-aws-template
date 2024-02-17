import {getTest} from "../test";

jest.setTimeout(50000000)

test("getTest", async () => {
  const res = await getTest({id: "id"})
  console.log(res)
})