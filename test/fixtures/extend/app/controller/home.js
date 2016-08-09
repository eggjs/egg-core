'use strict';

module.exports = function*() {
  this.body = {
    returnAppContext: this.appContext,
    returnPluginbContext: this.pluginbContext,
    returnAppRequest: this.request.appRequest,
    returnPluginbRequest: this.request.pluginbRequest,
    returnAppResponse: this.response.appResponse,
    returnPluginbResponse: this.response.pluginbResponse,
    returnAppApplication: this.app.appApplication,
    returnPluginbApplication: this.app.pluginbApplication,
  };
};
