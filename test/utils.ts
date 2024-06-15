import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EggCore } from '../src/index.js';
import { Application, EggCoreInitOptions } from './fixtures/egg/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFilepath(name: string) {
  return path.join(__dirname, 'fixtures', name);
}

export function createApp(name: string, options?: EggCoreInitOptions & { Application?: typeof EggCore }) {
  const baseDir = getFilepath(name);
  options = options ?? {};
  options.baseDir = baseDir;
  options.type = options.type ?? 'application';

  const CustomApplication = options.Application ?? Application;
  return new CustomApplication(options);
}

export const symbol = {
  view: Symbol('view'),
};
