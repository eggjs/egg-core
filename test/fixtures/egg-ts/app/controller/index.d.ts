import Home from './home';

declare module 'egg' {
  interface IController {
    home: Home;
  }
}
