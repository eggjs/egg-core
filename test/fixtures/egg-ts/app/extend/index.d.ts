import ExtendAgent from './agent';
import ExtendApplication from './application';
import ExtendContext from './context';
import ExtendRequest from './request';
import ExtendResponse from './response';
import ExtendHelper from './helper';

declare module 'egg' {
  interface Application {
    agentShow: typeof ExtendAgent.agentShow;
    applicationShow: typeof ExtendApplication.applicationShow;
  }

  interface Context {
    contextShow: typeof ExtendContext.contextShow;
  }

  interface Request {
    requestShow: typeof ExtendRequest.requestShow;
  }

  interface Response {
    responseShow: typeof ExtendResponse.responseShow;
  }

  interface IHelper {
    helperShow: typeof ExtendHelper.helperShow;
  }
}