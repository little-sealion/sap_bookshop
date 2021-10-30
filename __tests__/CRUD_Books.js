import request from 'supertest';

const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('CRUD Books test', () => {
  it('GET /Books --> array books', () => {
    return request(baseUrl)
      .get('/Books')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ID: expect.any(Number),
              title: expect.any(String),
              author_ID: expect.any(Number),
              stock: expect.any(Number),
            }),
          ])
        );
        res.body.value.forEach((book) => {
          if (book.stock > 111) {
            expect(book.title).toMatch(/ -- 11% discount!$/);
          }
        });
      });
  });

  it('GET /Books(id) -->  specific book by ID', () => {
    return request(baseUrl)
      .get('/Books(252)')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID: 252,
            title: expect.any(String),
            author_ID: expect.any(Number),
            stock: expect.any(Number),
          })
        );
        if (res.body.stock > 111) {
          expect(res.body.title).toMatch(/ -- 11% discount!$/);
        }
      });
  });

  it('GET /Books(id) --> 404 if not found', () => {
    return request(baseUrl)
      .get('/Books(9999)')
      .expect(404)
      .then((res) => {
        expect(res.body).toEqual({
          error: { code: '404', message: 'Not Found' },
        });
      });
  });
});
