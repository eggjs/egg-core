import path from 'node:path';
import { fileURLToPath } from 'node:url';
// import { Application as EggApplication } from './fixtures/egg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFilepath(name: string) {
  return path.join(__dirname, 'fixtures', name);
}

// export function createApp(name: string, options: any) {
//   const baseDir = getFilepath(name);
//   options = options || {};
//   options.baseDir = baseDir;
//   options.type = options.type || 'application';

//   let CustomApplication = EggApplication;
//   if (options.Application) {
//     CustomApplication = options.Application;
//   }

//   return new CustomApplication(options);
// }

export const symbol = {
  view: Symbol('view'),
};
