'use strict';

const assert = require('assert');
const request = require('supertest');
const utils = require('../utils');

describe('test/utils/router.test.js', () => {
  let app;
  before(() => {
    app = utils.createApp('router-app');
    app.loader.loadAll();
    return app.ready();
  });
  after(() => app.close());

  describe('router.resources', () => {
    describe('normal', () => {
      it('should GET /posts', () => {
        return request(app.callback())
          .get('/posts')
          .expect(200)
          .expect('index');
      });

      it('should GET /posts/new', () => {
        return request(app.callback())
          .get('/posts/new')
          .expect(200)
          .expect('new');
      });

      it('should POST /posts', () => {
        return request(app.callback())
          .post('/posts')
          .expect(200)
          .expect('create');
      });

      it('should GET /posts/:id', () => {
        return request(app.callback())
          .get('/posts/123')
          .expect(200)
          .expect('show - 123');
      });

      it('should GET /posts/:id/edit', () => {
        return request(app.callback())
          .get('/posts/123/edit')
          .expect(200)
          .expect('edit - 123');
      });

      it('should PUT /posts/:id', () => {
        return request(app.callback())
          .put('/posts/123')
          .expect(200)
          .expect('update - 123');
      });

      it('should DELETE /posts/:id', () => {
        return request(app.callback())
          .delete('/posts/123')
          .expect(200)
          .expect('destroy - 123');
      });
    });

    describe('controller url', () => {
      describe('controller not exists error', () => {
        it('should throw when controller not exists', done => {
          try {
            app.get('/hello', 'not.exist.controller');
          } catch (err) {
            assert(err.message === 'controller \'not.exist.controller\' not exists');
            done();
          }
        });
      });
      it('should GET /members', () => {
        return request(app.callback())
          .get('/members')
          .expect(200)
          .expect('index');
      });

      it('should GET /members/index', () => {
        return request(app.callback())
          .get('/members/index')
          .expect(200)
          .expect('index');
      });

      it('should GET /members/new', () => {
        return request(app.callback())
          .get('/members/new')
          .expect(200)
          .expect('new');
      });

      it('should GET /members/:id', () => {
        return request(app.callback())
          .get('/members/1231')
          .expect(200)
          .expect('show - 1231');
      });

      it('should POST /members', () => {
        return request(app.callback())
          .post('/members')
          .expect(404);
      });

      it('should PUT /members/:id', () => {
        return request(app.callback())
          .put('/members/1231')
          .expect(404);
      });

      it('should GET /POSTS', () => {
        return request(app.callback())
          .get('/POSTS')
          .expect(404);
      });
    });

    describe('no name', function() {
      it('should GET /comments', () => {
        return request(app.callback())
          .get('/comments')
          .expect('index')
          .expect(200);
      });

      it('should POST /comments', () => {
        return request(app.callback())
          .post('/comments')
          .expect('new')
          .expect(200);
      });
    });
  });

  describe('router.url', () => {
    it('should work', () => {
      assert(app.router.url('posts') === '/posts');
      assert(app.router.url('members') === '/members');
      assert(app.router.url('post', { id: 1 }) === '/posts/1');
      assert(app.router.url('member', { id: 1 }) === '/members/1');
      assert(app.router.url('new_post') === '/posts/new');
      assert(app.router.url('new_member') === '/members/new');
      assert(app.router.url('edit_post', { id: 1 }) === '/posts/1/edit');
      assert(app.router.url('params', { a: 1, b: 2 }) === '/params/1/2');
      // no match params
      assert(app.router.url('edit_post', {}) === '/posts/:id/edit');
      assert(app.router.url('noname') === '');
      assert(app.router.url('comment_index', { id: 1, a: 1 }) === '/comments/1?filter=&a=1');
    });

    it('should work with unknow params', () => {
      assert(app.router.url('posts', { name: 'foo', page: 2 }) === '/posts?name=foo&page=2');
      assert(app.router.url('posts', { name: 'foo&?', page: 2 }) === '/posts?name=foo%26%3F&page=2');
      assert(app.router.url('edit_post', { id: 10, page: 2 }) === '/posts/10/edit?page=2');
      assert(app.router.url('edit_post', { i: 2, id: 10 }) === '/posts/10/edit?i=2');
      assert(app.router.url('edit_post', { id: 10, page: 2, tags: [ 'chair', 'develop' ] })
         === '/posts/10/edit?page=2&tags=chair&tags=develop');
      assert(app.router.url('edit_post', { id: [ 10 ], page: [ 2 ], tags: [ 'chair', 'develop' ] })
         === '/posts/10/edit?page=2&tags=chair&tags=develop');
      assert(app.router.url('edit_post', { id: [ 10, 11 ], page: [ 2 ], tags: [ 'chair', 'develop' ] })
         === '/posts/10/edit?page=2&tags=chair&tags=develop');
    });

  });

  describe('router.pathFor', () => {
    it('should work', () => {
      assert(app.router.pathFor('posts') === '/posts');
    });
  });

  describe('router.method', () => {
    it('router method include HEAD', () => {
      assert(app.router.methods.indexOf('HEAD') > -1);
    });
  });

  describe('router middleware', () => {
    it('should support all kinds of middlewares', () => {
      return request(app.callback())
        .get('/middleware')
        .expect(200)
        .expect([ 'generator', 'async', 'common' ]);
    });

    it('should support all kinds of middlewares with name', () => {
      return request(app.callback())
        .get('/named_middleware')
        .expect(200)
        .expect([ 'generator', 'async', 'common' ]);
    });

    it('should support all kinds of middlewares with register', () => {
      return request(app.callback())
        .get('/register_middleware')
        .expect(200)
        .expect([ 'generator', 'async', 'common' ]);
    });
  });
});
