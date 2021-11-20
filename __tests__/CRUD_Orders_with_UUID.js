import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe.only('CRUD Order test', () => {
  // if we post an order with invalid UUID, it should return error code 400
  it('POST /Orders with UUID (invalid UUID) --> req error ( 400,Invalid Value)', () => {
    // using uuidv4 to create a UUID, then slice it to get an invalid UUID mimi
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

  // if we post an order with valid UUID, it should return success code 201, and return the order created, it
  // should be an object contains ID, book_ID, amount fields
  it('POST /Orders with UUID (valid UUID) --> created order', async () => {
    const ID = uuidv4();
    const book_ID = 251;
    const amount = 1;

    const res = await request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        ID,
        book_ID,
        amount,
      })
    );
  });

  // if we post an order with the same UUID for second time, it should return error code 400, with message
  // 'Entity already exists'
  it('POST /Orders with UUID (repeat valid UUID) --> 400, Entity already exists', async () => {
    // create the uuid
    const ID = uuidv4();
    const book_ID = 251;
    const amount = 1;
    //post the order for the first time
    await request(baseUrl).post('/Orders').send({ ID, book_ID, amount }); //use the uuid first time

    // post the order for the second time with the same uuid
    const res = await request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: expect.objectContaining({
        code: '400',
        message: 'Entity already exists',
      }),
    });
  });

  // post an order with invalid data, the stock of that product should decrease accordingly
  it('POST /Orders with UUID --> created order ', async () => {
    const ID = uuidv4();
    const book_ID = 252;
    const amount = 1;

    // get the stock number of book_ID before post an order
    const res1 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock } = res1.body;

    // if the product stock is larger than the post amount, it should return sucess code 201, and return the created order object
    if (stock >= amount) {
      const res2 = await request(baseUrl).post('/Orders').send({
        ID,
        book_ID,
        amount,
      });

      expect(res2.statusCode).toBe(201);
      // if the order post sucessfully, the product stock should decrease accordingly
      expect(res2.body).toEqual(
        expect.objectContaining({
          ID,
          book_ID,
          amount,
        })
      );

      const res3 = await request(baseUrl).get(`/Books(${book_ID})`);
      const { stock: updatedStock } = res3.body;

      expect(stock - updatedStock).toEqual(amount);
    } else {
      // if the product stock is less than the post amount, it should return error code 409 with message 'Sold out, sorry'
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
  // post an order with valid data, the stock of that product should decrease accordingly
  it('POST /Orders with UUID --> created order ', async () => {
    // alter the post data to be different from the last test case, make the amount extremely big
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

  // post an order without specifing the amount, it should return error code 400 with message 'Order at least 1 book'
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

  // post an order with amount set to 0, it should return error code 400 with message 'Order at least 1 book'
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

  // post an order with inexist book, it should return error code 409 with message 'Sold out, sorry'
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
