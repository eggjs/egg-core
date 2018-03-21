import { Service } from 'egg';

export default class TestService extends Service {
  getTest() {
    return 'from service';
  }
}