import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('additional requests orders_book', () => {
  // send a get request for the orders and set the expand as book, it should return an arrayof orders,
  // for each order object, it should contain ID,book_ID,amount, book fields, also the book_ID value should match the ID field
  //of the book obeject
  it('GET Orders?$expand=book', async () => {
    const res = await request(baseUrl).get('/Orders?$expand=book');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          // the ID must match uuid format
          ID: expect.stringMatching(
            /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
          ),
          book_ID: expect.any(Number),
          amount: expect.any(Number),
          // the book object must contain ID,title,author_ID, stock field
          book: {
            ID: expect.any(Number),
            title: expect.any(String),
            author_ID: expect.any(Number),
            stock: expect.any(Number),
          },
        }),
      ])
    );
    // for each order , order.book_ID should match order.book.ID
    res.body.value.forEach((order) => {
      expect(order.book_ID).toEqual(order.book.ID);
    });
  });
});
