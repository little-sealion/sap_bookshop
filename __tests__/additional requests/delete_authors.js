import request from 'supertest';
const baseUrl =
  'https://my-bookshop-srv-shiny-mouse-nf.cfapps.us10.hana.ondemand.com/catalog';

describe('additional requests deleteAuthor(101)', () => {
  // if we try to delete an author with books associated with him/she, the author cann not be deleted,
  // it should return code 400 with message 'Reference ....'
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
});
