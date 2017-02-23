module.exports = function (app) {
  const common = app.middlewares.common();
  const asyncMw = app.middlewares.async();
  const generator = app.middlewares.generator();

  app
    .get('/locals/router', app.controller.locals.router)
    .get('/members/index', 'members.index')
    .delete('/members/delete/:id', 'members.delete')
    .del('/members/del/:id', 'members.delete')
    .resources('posts', '/posts', 'posts')
    .resources('members', '/members', app.controller.members)
    .resources('/comments', app.controller.comments)
    .get('comment_index', '/comments/:id?filter=', app.controller.comments.index)
    .get('params', '/params/:a/:b', app.controller.locals.router)
    .get('/middleware', common, asyncMw, generator, 'middleware')
    .get('middleware', '/named_middleware', common, asyncMw, generator, 'middleware')
    .register('/comments', [ 'post' ] , app.controller.comments.new)
    .register('/register_middleware', [ 'get' ], [ common, asyncMw, generator, 'middleware' ])
    .redirect('/redirect', '/middleware', 302);

  app.router
    .get('/router_middleware', common, asyncMw, generator, 'middleware')
    .redirect('/router_redirect', '/middleware');

  app.get('packages', /^\/packages\/(.*)/, 'package.get');
};
