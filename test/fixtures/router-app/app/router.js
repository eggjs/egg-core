module.exports = function (app) {
  const common = app.middlewares.common();
  const asyncMw = app.middlewares.async();
  const generator = app.middlewares.generator();

  app.get('/locals/router', app.controller.locals.router);
  app.get('/members/index', 'members.index');
  app.resources('posts', '/posts', 'posts');
  app.resources('members', '/members', app.controller.members);
  app.resources('/comments', app.controller.comments);
  app.get('comment_index', '/comments/:id?filter=', app.controller.comments.index);
  app.get('params', '/params/:a/:b', app.controller.locals.router);
  app.get('/middleware', common, asyncMw, generator, 'middleware');
  app.get('middleware', '/named_middleware', common, asyncMw, generator, 'middleware');
  app.register('/comments', [ 'post' ] , app.controller.comments.new);
  app.register('/register_middleware', [ 'get' ], [ common, asyncMw, generator, 'middleware' ]);
};
