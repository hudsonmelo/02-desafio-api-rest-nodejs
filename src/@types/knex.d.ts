// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'

declare module 'Knex/types/tables' {
  interface Tables {
    users: {
      id: string
      session_id: string
      name: string
      email: string
    }
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      is_on_diet: boolean
      date: Date
    }
  }
}
