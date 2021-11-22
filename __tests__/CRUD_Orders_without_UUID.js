import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('CRUD Orders test', () => {
  describe('post order test', () => {
    // set up the test enviroment by updateing book(ID255) stock to be 150
    beforeEach(async () => {
      // make a post request to create an test author first, this author should have no book associated with her
      const title = 'Head First Java';
      const author_ID = 101;
      const stock = 150;
      await request(baseUrl)
        .put('/Books(255)')
        .send({ title, author_ID, stock })
        .catch((err) => console.log(err.message));
    });

    // if we post an order with valid data, it should return success code 201, and return the order created, it
    // should be an object contains book_ID, amount fields
    it('POST /Orders without UUID --> created order ', async () => {
      const book_ID = 255;
      const amount = 10;

      const res = await request(baseUrl).post('/Orders').send({
        book_ID,
        amount,
      });
      // if the product stock is larger than the post amount, it should return sucess code 201, and return the created order object
      expect(res.statusCode).toBe(201);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          book_ID: 255,
          amount: 10,
        })
      );

      // if the order post sucessfully, the product stock should decrease accordingly
      const res2 = await request(baseUrl).get(`/Books(${book_ID})`);
      const { stock: updatedStock } = res2.body;

      // 150 is the original amount before order posted
      expect(150 - updatedStock).toBe(amount);
    });

    // post an order with amount > stock, should return an 409 error
    it('POST /Orders without UUID --> created order ', async () => {
      // set the amount 200 larger than the stock 150
      const book_ID = 255;
      const amount = 200;
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
    });

    // post an order without specifing the amount, it should return error code 400 with message 'Order at least 1 book'
    it('POST /Orders without UUID (without amount) --> req error ( 400,Order at least 1 book)', async () => {
      return request(baseUrl)
        .post('/Orders')
        .send({ book_ID: 255 })
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
    it('POST /Orders without UUID (amount:0) --> req error ( 400,Order at least 1 book)', async () => {
      return request(baseUrl)
        .post('/Orders')
        .send({ book_ID: 255, amount: 0 })
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

  describe('get order tets', () => {
    it('Get orders --> should return an array of orders', () => {
      return request(baseUrl)
        .get('/Orders')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((res) => {
          let orders = res.body.value;
          expect(orders.length).toBeGreaterThan(0);
          orders.forEach((order) => {
            expect(order).toEqual(
              expect.objectContaining({
                createdAt: expect.any(String),
                createdBy: expect.any(String),
                modifiedAt: expect.any(String),
                modifiedBy: expect.any(String),
                ID: expect.stringMatching(
                  /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
                ),
                book_ID: expect.any(Number),
                amount: expect.any(Number),
              })
            );
          });
        });
    });

    it('Get order --> should return a specific order', () => {
      return request(baseUrl)
        .get('/Orders(c13d3eec-942e-470d-97b3-e03322136636)')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((res) => {
          let order = res.body;
          expect(order.ID).toBe('c13d3eec-942e-470d-97b3-e03322136636');
        });
    });

    it('Get order with invalid ID --> should return error 400', () => {
      return request(baseUrl)
        .get('/Orders(c13d3eec-942e-470d-97b3-e03322136636-09)')
        .expect(400)
        .expect('Content-Type', /json/)
        .then((res) => {
          let { message } = res.body.error;
          expect(message).toMatch(
            /Expected uri token 'CLOSE' could not be found/
          );
        });
    });
  });

  describe('Put order test', () => {
    it('put order', () => {
      return request(baseUrl)
        .put('/Orders(c13d3eec-942e-470d-97b3-e03322136636)')
        .send({
          book_ID: 201,
          amount: 5,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then((res) => {
          let now = new Date();
          // the modeifiedAt time should be the same as the time put post sent
          expect(res.body.modifiedAt).toMatch(now.toISOString().slice(0, -4));
          expect(res.body.amount).toBe(5);
          expect(res.body.book_ID).toBe(201);
        });
    });
    it('put order without sending data', () => {
      return request(baseUrl)
        .put('/Orders(c13d3eec-942e-470d-97b3-e03322136636)')
        .expect(400);
    });

    it('put order with invalid data', () => {
      return request(baseUrl)
        .put('/Orders(c13d3eec-942e-470d-97b3-e03322136636)')
        .send({
          book_ID: 201,
          amount: 'ramdom string',
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then((res) => {
          expect(res.body.error.code).toBe('400');
          expect(res.body.error.message).toMatch(/Invalid value/);
        });
    });
  });

  describe('Delete order test', () => {
    // after test, cerate the order that has been deleted
    afterAll(async () => {
      await request(baseUrl).post('/Orders').send({
        ID: 'c13d3eec-942e-470d-97b3-e03322136636',
        book_ID: 201,
        amount: 1,
      });
    });
    it('delete an exisiting order', () => {
      return request(baseUrl)
        .delete('/Orders(c13d3eec-942e-470d-97b3-e03322136636)')
        .expect(204);
    });

    it('delete an inexisit order', () => {
      return request(baseUrl)
        .delete('/Orders(c13d3eec-942e-470d-97b3-e03322136636-09)')
        .expect(400)
        .then((res) => {
          expect(res.body.error.message).toMatch(
            /Expected uri token 'CLOSE' could not be found/
          );
        });
    });
  });
});
