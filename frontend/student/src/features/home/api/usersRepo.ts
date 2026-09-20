// this file ONLY handles REST calls. never UI, never react hooks.

import { UsersService } from "@/client"

export const usersRepo = {
  me() {
    return UsersService.readUserMe()
  },
}
