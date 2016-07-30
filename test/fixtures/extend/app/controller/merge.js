'use strict';

exports.appOverrideChair = function*() {
  this.body = {
    value: this.ajax()
  };
};

exports.pluginOverrideChair = function*() {
  this.body = {
    value: this.ip
  };
};

exports.appOverridePlugin = function*() {
  this.body = {
    value: this.response.overridePlugin
  };
};
