import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('additional requests orders_book_author', () => {
  it('GET Orders?$expand=book($expand=author)', async () => {
    const res = await request(baseUrl).get(
      '/Orders?$expand=book($expand=author)'
    );
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ID: expect.stringMatching(
            /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
          ),
          book_ID: expect.any(Number),
          amount: expect.any(Number),
          book: {
            ID: expect.any(Number),
            title: expect.any(String),
            author_ID: expect.any(Number),
            stock: expect.any(Number),
            author: {
              ID: expect.any(Number),
              name: expect.any(String),
            },
          },
        }),
      ])
    );
    res.body.value.forEach((order) => {
      expect(order.book_ID).toEqual(order.book.ID);
      expect(order.book.author_ID).toEqual(order.book.author.ID);
    });
  });
});
