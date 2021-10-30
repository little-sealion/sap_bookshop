import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe.only('CRUD Order test', () => {
  it('POST /Orders with UUID (invalid UUID) --> req error ( 400,Invalid Value)', () => {
    const ID = uuidv4().slice(0, 30);
    const book_ID = 251;
    const amount = 1;
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount })
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual({
          error: {
            code: '400',
            message: `Deserialization Error: Invalid value ${ID} (JavaScript string) for property \"ID\". A string value in the format 8HEXDIG-4HEXDIG-4HEXDIG-4HEXDIG-12HEXDIG must be specified as value for type Edm.Guid.`,
          },
        });
      });
  });

  it('POST /Orders with UUID (valid UUID) --> created order', async () => {
    const ID = uuidv4();
    const book_ID = 251;
    const amount = 1;

    const res = await request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(ID).toMatch(
      /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        ID,
        book_ID,
        amount,
      })
    );
  });

  it('POST /Orders with UUID (repeat valid UUID) --> 400, Entity already exists', async () => {
    const ID = uuidv4();
    const book_ID = 251;
    const amount = 1;

    await request(baseUrl).post('/Orders').send({ ID, book_ID, amount }); //use the uuid first time

    const res = await request(baseUrl) //use the uuid second time
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: expect.objectContaining({
        code: '400',
        message: 'Entity already exists',
      }),
    });

    expect(ID).toMatch(
      /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
    );
  });

  it('POST /Orders with UUID --> created order ', async () => {
    const ID = uuidv4();
    const book_ID = 252;
    const amount = 3;

    // get the stock number of book_ID before post an order
    const res1 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock } = res1.body;

    if (stock >= amount) {
      const res2 = await request(baseUrl).post('/Orders').send({
        ID,
        book_ID,
        amount,
      });

      expect(res2.statusCode).toBe(201);

      expect(res2.body).toEqual(
        expect.objectContaining({
          ID,
          book_ID,
          amount, //if stock lasts, return created order , otherwise return sold out
        })
      );

      const res3 = await request(baseUrl).get(`/Books(${book_ID})`);
      const { stock: updatedStock } = res3.body;

      expect(stock - updatedStock).toEqual(amount);
    } else {
      return request(baseUrl)
        .post('/Orders')
        .send({ ID, book_ID, amount })
        .expect(409)
        .then((res) => {
          expect(res.body).toEqual({
            error: expect.objectContaining({
              code: '409',
              message: 'Sold out, sorry',
            }),
          });
        });
    }
  });

  it('POST /Orders with UUID --> created order ', async () => {
    const ID = uuidv4();
    const book_ID = 252;
    const amount = 100000;

    // get the stock number of book_ID before post an order
    const res1 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock } = res1.body;

    if (stock >= amount) {
      const res2 = await request(baseUrl).post('/Orders').send({
        ID,
        book_ID,
        amount,
      });

      expect(res2.statusCode).toBe(201);
      // expect(res2.headers['conent-type']).toMatch(/json/);
      expect(res2.body).toEqual(
        expect.objectContaining({
          ID,
          book_ID,
          amount, //if stock lasts, return created order , otherwise return sold out
        })
      );

      const res3 = await request(baseUrl).get(`/Books(${book_ID})`);
      const { stock: updatedStock } = res3.body;

      expect(stock - updatedStock).toEqual(amount);
    } else {
      return request(baseUrl)
        .post('/Orders')
        .send({ ID, book_ID, amount })
        .expect(409)
        .then((res) => {
          expect(res.body).toEqual({
            error: expect.objectContaining({
              code: '409',
              message: 'Sold out, sorry',
            }),
          });
        });
    }
  });

  it('POST /Orders with UUID (without amount) --> req error ( 400,Order at least 1 book)', () => {
    const ID = uuidv4();
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID: 252 })
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual({
          error: expect.objectContaining({
            code: '400',
            message: 'Order at least 1 book',
          }),
        });
      });
  });

  it('POST /Orders with UUID (amount:0) --> req error ( 400,Order at least 1 book)', async () => {
    const ID = uuidv4();
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID: 252, amount: 0 })
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual({
          error: expect.objectContaining({
            code: '400',
            message: 'Order at least 1 book',
          }),
        });
      });
  });

  it('POST /Orders with UUID (inexist book) --> req error ( 409,Sold out, sorry)', async () => {
    const ID = uuidv4();
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID: 999999, amount: 1 })
      .expect(409)
      .then((res) => {
        expect(res.body).toEqual({
          error: expect.objectContaining({
            code: '409',
            message: 'Sold out, sorry',
          }),
        });
      });
  });
});
