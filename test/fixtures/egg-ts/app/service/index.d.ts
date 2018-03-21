import Test from './Test';

declare module 'egg' {
  interface IService {
    test: Test;
  }
}