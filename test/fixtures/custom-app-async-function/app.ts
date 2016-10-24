export default async function(app) {
  await wait(1000);
  app.app = true;
}

function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
