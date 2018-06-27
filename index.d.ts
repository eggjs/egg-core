import * as KoaApplication from 'koa';


export interface EggCoreOptions {
  baseDir: string;
  type: 'application' | 'agent';
  plugins?: any;
}

export interface EggLoaderOptions {
  app: EggCore;
  baseDir: string;
  logger: Logger;
  plugins?: any;
}

export interface Logger {
  info(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
  debug(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
}

export class EggCore extends KoaApplication {
  constructor(options: EggCoreOptions);
}

export class EggLoader {
  constructor(options: EggLoader);
}
