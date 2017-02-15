module.exports = function* () {
  const ctx = this.service.ctx.get();
  this.body = String(ctx === this);
};
