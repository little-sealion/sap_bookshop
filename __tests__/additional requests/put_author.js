import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('additional request put author', () => {
  // send a put request to change author name, it should return the updated author object, with the name to be the specific name
  it('PUT changes author name', () => {
    const ID = 101;
    const name = 'J.K.Rowling';
    return request(baseUrl)
      .put(`/Authors(${ID})`)
      .send({ name })
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ID,
            name: 'J.K.Rowling',
          })
        );
      });
  });
});
