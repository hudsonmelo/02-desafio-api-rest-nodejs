import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const meals = await knex('meals').where('user_id', request.user?.id)

    return { meals }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const meal = await knex('meals')
      .where({ user_id: request.user?.id, id })
      .first()

    return { meal }
  })

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isOnDiet, date } = createMealsBodySchema.parse(
        request.body,
      )
      await knex('meals').insert({
        id: randomUUID(),
        user_id: request.user?.id,
        name,
        description,
        is_on_diet: isOnDiet,
        date,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const updateMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = updateMealsParamsSchema.parse(request.params)

      const { name, description, isOnDiet, date } = updateMealsBodySchema.parse(
        request.body,
      )

      await knex('meals').where({ user_id: request.user?.id, id }).update({
        name,
        description,
        is_on_diet: isOnDiet,
        date,
      })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const deleteMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealsParamsSchema.parse(request.params)

      await knex('meals').where({ user_id: request.user?.id, id }).del()

      return reply.status(204).send()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const totalMeals = await knex('meals').where('user_id', request.user?.id)

      const totalOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_on_diet: true })
        .count('*', { as: 'total' })
        .first()

      const totalOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_on_diet: false })
        .count('*', { as: 'total' })
        .first()

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.status(200).send({
        summary: {
          totalMeals: totalMeals.length,
          totalMealsOnDiet: totalOnDiet?.total,
          totalMealsOffDiet: totalOffDiet?.total,
          bestOnDietSequence,
        },
      })
    },
  )
}
