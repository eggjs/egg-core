import * as KoaApplication from 'koa';
import { Logger } from 'egg-logger';


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

export class EggCore extends KoaApplication {
  constructor(options: EggCoreOptions);
}

export class EggLoader {
  constructor(options: EggLoader);
}
