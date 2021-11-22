import request from 'supertest';

const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('CRUD Books test', () => {
  // if we send get all books request, it should return an array of books, each book should
  // contain 'ID', 'title','author_ID','stock' fields
  it('GET /Books --> array books', () => {
    return request(baseUrl)
      .get('/Books')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        let books = res.body.value;
        expect(books.length).toBeGreaterThan(0);
        let book = books.find((book) => book.ID === 255);
        expect(book.title).toBe('Head First Java -- 11% discount!');
        expect(book.author_ID).toBe(101);

        // for each book in the returned array,if the stock of that book is > 111, then the book title should end with '-- 11% discount!'
        res.body.value.forEach((book) => {
          if (book.stock > 111) {
            expect(book.title).toMatch(/ -- 11% discount!$/);
          }
        });
      });
  });

  // if we send get request for a specific book, it should return an book object
  // with that specific ID
  it('GET /Books(id) -->  specific book by ID', () => {
    return request(baseUrl)
      .get('/Books(255)')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID: 255,
            title: 'Head First Java -- 11% discount!',
            author_ID: expect.any(Number),
            stock: expect.any(Number),
          })
        );
        // if the stock of that book is > 111, then the book title should end with '-- 11% discount!'
        if (res.body.stock > 111) {
          expect(res.body.title).toMatch(/ -- 11% discount!$/);
        }
      });
  });
  // if we send get request for an inexist book, it should return code 404, with message 'Not Found'
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

  it('Post /Books --> create a new book with ID=1000', () => {
    const ID = 1000;
    const title = 'Why Women Kill';
    const author_ID = 101;
    const stock = 100;
    return request(baseUrl)
      .post('/Books')
      .send({ ID, title, author_ID, stock })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID: 1000,
            title: 'Why Women Kill',
            author_ID: 101,
            stock: 100,
          })
        );
      });
  });

  it('Put /Books(1000) --> update book info', () => {
    return request(baseUrl)
      .put('/Books(1000)')
      .send({ title: 'Do not kill', stock: 20 })
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            title: 'Do not kill',
            stock: 20,
          })
        );
      });
  });

  it('Delete /Books(1000) --> delete an exisiting book', () => {
    return request(baseUrl).delete('/Books(1000)').expect(204);
  });
});
