import { EggAppConfig } from 'egg';

export default (appInfo: EggAppConfig) => {
  return {
    testFromA: 'from plugins',
  };
}

declare module 'egg' {
  interface EggAppConfig {
    testFromA: string;
  }
}