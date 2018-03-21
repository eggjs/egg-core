import { EggAppConfig } from 'egg';

export default (appInfo: EggAppConfig) => {
  return {
    middleware: [ 'mid' ],
    test: 'from config.default',
  };
}

declare module 'egg' {
  interface EggAppConfig {
    test: string;
  }
}