module.exports = function (app) {
  app.get('/locals/router', app.controller.locals.router);
  app.get('member_index', '/members/index', 'members.index');
  app.resources('posts', '/posts', 'posts');
  app.resources('members', '/members', app.controller.members);
  app.resources('/comments', app.controller.comments);
  app.get('comment_index', '/comments/:id?filter=', app.controller.comments.index);
  app.register('/comments', [ 'post' ] , app.controller.comments.new);
};
