import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe.only('CRUD Order test', () => {
  // set up the test enviroment by updateing book(ID255) stock to be 100
  beforeEach(async () => {
    // make a post request to create an test author first, this author should have no book associated with her
    const title = 'Head First Java';
    const author_ID = 101;
    const stock = 100;
    await request(baseUrl)
      .put('/Books(201)')
      .send({ title, author_ID, stock })
      .catch((err) => console.log(err.message));
  });

  // if we post an order with invalid UUID, it should return error code 400
  it('POST /Orders with UUID (invalid UUID) --> req error ( 400,Invalid Value)', () => {
    // using uuidv4 to create a UUID, then slice it to get an invalid UUID mimi
    const ID = uuidv4().slice(0, 30);
    const book_ID = 201;
    const amount = 1;
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount })
      .expect(400)
      .then((res) => {
        expect(res.body.error.code).toBe('400');
        expect(res.body.error.message).toMatch(/Invalid value/);
      });
  });

  // if we post an order with valid UUID, it should return success code 201, and return the order created, it
  // should be an object contains ID, book_ID, amount fields
  it('POST /Orders with UUID (valid UUID) --> created order', async () => {
    const ID = uuidv4();
    const book_ID = 201;
    const amount = 10;

    const res = await request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        ID,
        book_ID: 201,
        amount: 10,
      })
    );
  });

  // if we post an order with the same UUID for second time, it should return error code 400, with message
  // 'Entity already exists'
  it('POST /Orders with UUID (repeat valid UUID) --> 400, Entity already exists', async () => {
    // create the uuid
    const ID = uuidv4();
    const book_ID = 201;
    const amount = 1;
    //post the order for the first time
    await request(baseUrl).post('/Orders').send({ ID, book_ID, amount }); //use the uuid first time

    // post the order for the second time with the same uuid
    const res = await request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount });

    expect(res.body.error.code).toBe('400');
    expect(res.body.error.message).toMatch(/Entity already exists/);
  });

  // post an order with amount less than stock, it should create a new order
  it('POST /Orders with UUID --> create a new order ', async () => {
    const ID = uuidv4();
    const book_ID = 201;
    const amount = 10;

    // if the product stock is larger than the post amount, it should return sucess code 201, and return the created order object

    const res = await request(baseUrl).post('/Orders').send({
      ID,
      book_ID,
      amount,
    });

    expect(res.statusCode).toBe(201);
    // if the order post sucessfully, the product stock should decrease accordingly
    expect(res.body).toEqual(
      expect.objectContaining({
        ID,
        book_ID: 201,
        amount: 10,
      })
    );
    // send a get request to get the new stock of the specific book
    const res2 = await request(baseUrl).get(`/Books(${book_ID})`);
    const { stock: updatedStock } = res2.body;
    // console.log('updatedStock', updatedStock);
    // the original stock was set to be 100
    expect(100 - updatedStock).toEqual(amount);
  });

  // post an order with amount exceeds stock, it should return error 409
  it('POST /Orders with UUID --> return error 409 ', async () => {
    // alter the post data to be different from the last test case, make the amount extremely big
    const ID = uuidv4();
    const book_ID = 201;
    const amount = 200;

    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID, amount })
      .expect(409)
      .then((res) => {
        expect(res.body.error.message).toMatch(/Sold out/);
      });
  });

  // post an order without specifing the amount, it should return error code 400 with message 'Order at least 1 book'
  it('POST /Orders with UUID (without amount) --> req error ( 400,Order at least 1 book)', () => {
    const ID = uuidv4();
    return request(baseUrl)
      .post('/Orders')
      .send({ ID, book_ID: 201 })
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
      .send({ ID, book_ID: 201, amount: 0 })
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
