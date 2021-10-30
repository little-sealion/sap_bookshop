import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe.only('CRUD Orders test', () => {
  it('POST /Orders without UUID --> created order ', async () => {
    const book_ID = 252;
    const amount = 10;

    // get the stock number of book_ID before post an order
    const res1 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock } = res1.body;

    if (stock >= amount) {
      const res2 = await request(baseUrl).post('/Orders').send({
        book_ID,
        amount,
      });

      expect(res2.statusCode).toBe(201);
      expect(res2.headers['content-type']).toMatch(/json/);
      expect(res2.body).toEqual(
        expect.objectContaining({
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
        .send({ book_ID, amount })
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

  it('POST /Orders without UUID --> created order ', async () => {
    const book_ID = 252;
    const amount = 100000;

    // get the stock number of book_ID before post an order
    const res1 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock } = res1.body;

    if (stock >= amount) {
      const res2 = await request(baseUrl).post('/Orders').send({
        book_ID,
        amount,
      });

      expect(res2.statusCode).toBe(201);
      expect(res2.headers['content-type']).toMatch(/json/);
      expect(res2.body).toEqual(
        expect.objectContaining({
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
        .send({ book_ID, amount })
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

  it('POST /Orders without UUID (without amount) --> req error ( 400,Order at least 1 book)', async () => {
    return request(baseUrl)
      .post('/Orders')
      .send({ book_ID: 252 })
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

  it('POST /Orders without UUID (amount:0) --> req error ( 400,Order at least 1 book)', async () => {
    return request(baseUrl)
      .post('/Orders')
      .send({ book_ID: 252, amount: 0 })
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

  it('POST /Orders without UUID (inexist book) --> req error ( 409,Sold out, sorry)', () => {
    return request(baseUrl)
      .post('/Orders')
      .send({ book_ID: 999999, amount: 1 })
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
