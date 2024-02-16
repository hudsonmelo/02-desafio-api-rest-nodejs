import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Meal routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Bolo de Brigadeiro',
        description: 'Bolo de Brigadeiro',
        isOnDiet: false,
        date: '2022-10-10',
      })
      .expect(201)
  })

  it('should be able to get all meals', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Brigadeiro',
      description: 'Bolo de Brigadeiro',
      isOnDiet: false,
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Chocolate',
      description: 'Bolo de Chocolate',
      isOnDiet: true,
      date: '2022-10-10',
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Bolo de Chocolate',
        description: 'Bolo de Chocolate',
      }),
    ])
  })

  it('should be able to get a meal by id', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Brigadeiro',
      description: 'Bolo de Brigadeiro',
      isOnDiet: false,
      date: '2022-10-10',
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const { id } = listMealsResponse.body.meals[0]

    const getMealResponse = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Bolo de Brigadeiro',
        description: 'Bolo de Brigadeiro',
      }),
    )
  })

  it('should be able to update a meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Brigadeiro',
      description: 'Bolo de Brigadeiro',
      isOnDiet: false,
      date: '2022-10-10',
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const { id } = listMealsResponse.body.meals[0]

    await request(app.server)
      .put(`/meals/${id}`)
      .set('Cookie', cookies)
      .send({
        name: 'Bolo de Chocolate',
        description: 'Bolo de Chocolate',
        isOnDiet: true,
        date: '2022-10-10',
      })
      .expect(200)
  })

  it('should be able to delete a meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Brigadeiro',
      description: 'Bolo de Brigadeiro',
      isOnDiet: false,
      date: '2022-10-10',
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const { id } = listMealsResponse.body.meals[0]

    await request(app.server)
      .delete(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(204)
  })

  it('should be able to show summary', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'test@example.com',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Brigadeiro',
      description: 'Bolo de Brigadeiro',
      isOnDiet: false,
      date: '2022-10-10',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Chocolate',
      description: 'Bolo de Chocolate',
      isOnDiet: true,
      date: '2022-10-10',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Bolo de Morango',
      description: 'Bolo de Morango',
      isOnDiet: true,
      date: '2022-10-10',
    })

    const summaryResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      totalMeals: 3,
      totalMealsOnDiet: 2,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 2,
    })
  })
})
