import path from 'node:path';
import { Application as EggApplication } from './fixtures/egg';

export function getFilepath(name: string) {
  return path.join(__dirname, 'fixtures', name);
}

export function createApp(name, options) {
  const baseDir = this.getFilepath(name);
  options = options || {};
  options.baseDir = baseDir;
  options.type = options.type || 'application';

  let CustomApplication = EggApplication;
  if (options.Application) {
    CustomApplication = options.Application;
  }

  return new CustomApplication(options);
}

export const symbol = {
  view: Symbol('view'),
};
