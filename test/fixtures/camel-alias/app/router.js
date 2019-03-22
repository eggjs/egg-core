module.exports = function (app) {
  app.router.get('/', async ctx => {
    ctx.body = {
      UserProfile: !!ctx.service.UserProfile,
      userProfile: !!ctx.service.userProfile,
      admin: !!ctx.service.sub.admin,
      Admin: !!ctx.service.sub.Admin,
    };
  });
};
