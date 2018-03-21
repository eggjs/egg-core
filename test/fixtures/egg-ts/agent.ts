import { Application } from 'egg';

export default (app: Application) => {
  app.fromCustomAgent = 'from custom agent';
};

declare module 'egg' {
  interface Application {
    fromCustomAgent: string;
  }
}
