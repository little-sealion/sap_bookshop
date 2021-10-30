import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('CRUD authors test', () => {
  it('GET /Authors --> array authors', () => {
    return request(baseUrl)
      .get('/Authors')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ID: expect.any(Number),
              name: expect.any(String),
            }),
          ])
        );
      });
  });

  it('GET /Authors(id) --> specific author by ID', () => {
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
    return request(baseUrl)
      .get('/Authors(9999)')
      .expect(404)
      .then((res) => {
        expect(res.body).toEqual({
          error: { code: '404', message: 'Not Found' },
        });
      });
  });
});
