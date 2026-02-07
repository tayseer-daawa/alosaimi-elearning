// this file ONLY handles REST calls. never UI, never react hooks.

import { fetcher } from "../../../shared/api/fetcher"

export const exampleRepo = {
  list() {
    return fetcher("/api/examples") // your backend endpoint
  },
  getOne(id: string) {
    return fetcher(`/api/examples/${id}`)
  },
  create(data: any) {
    return fetcher("/api/examples", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
