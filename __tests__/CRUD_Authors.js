import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';
// const baseUrl = 'localhost:4004/catalog';mimi

describe('CRUD authors test', () => {
  beforeAll(async () => {
    // make a post request to create an test author first, this author should have no book associated with her
    const ID = 200;
    const name = 'Tess Zheng';
    await request(baseUrl)
      .post('/Authors')
      .send({ ID, name })
      .catch((err) => console.log(err.message));
  });

  it('GET /Authors --> array authors', () => {
    // if we send get all authors request, it should return an array of authors, each author should
    // contain 'ID' and 'name' fields
    return request(baseUrl)
      .get('/Authors')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        let authors = res.body.value;
        expect(authors.length).toBeGreaterThan(0);
        let author = authors.find((author) => author.ID === 200);
        expect(author.name).toBe('Tess Zheng');
      });
  });

  it('GET /Authors(id) --> specific author by ID', () => {
    // if we send get request for a specific author, it should return an author object
    // with that specific ID
    return request(baseUrl)
      .get('/Authors(101)')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID: 101,
            name: expect.any(String),
          })
        );
      });
  });

  it('GET /Authors(id) --> 404 if not found', () => {
    // if we send get request for an inexist author, it should return code 404, with message 'Not Found' aaa
    return request(baseUrl)
      .get('/Authors(9999)')
      .expect(404)
      .then((res) => {
        expect(res.body).toEqual({
          error: { code: '404', message: 'Not Found' },
        });
      });
  });

  it('delete author with book associated to', () => {
    return request(baseUrl)
      .delete('/Authors(101)')
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual({
          error: expect.objectContaining({
            code: '400',
            message: 'Reference integrity is violated for association "author"',
          }),
        });
      });
  });

  it('delete author with no book associated to', () => {
    // try to delete the author with no book associated to
    return request(baseUrl).delete('/Authors(200)').expect(204);
  });

  // send a put request to change author name, it should return the updated author object, with the name to be the specific name
  it('PUT changes author name', () => {
    const ID = 101;
    const name = 'D.J.Rowling';
    return request(baseUrl)
      .put(`/Authors(${ID})`)
      .send({ name })
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID: 101,
            name: 'D.J.Rowling',
          })
        );
      });
  });
});
