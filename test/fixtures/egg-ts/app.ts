import { Application } from 'egg';

export default (app: Application) => {
  app.fromCustomApp = 'from custom app';
};

declare module 'egg' {
  interface Application {
    fromCustomApp: string;
  }
}
