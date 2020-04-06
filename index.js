const _ = require('lodash');
const VaultService = require('vault-es6-cli');
const BaseServerlessPlugin = require('base-serverless-plugin');
const Commands = require('./lib/Commands');

const LOG_PREFFIX = '[ServerlessVaultPlugin] - ';

class ServerlessVaultPlugin extends BaseServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options, LOG_PREFFIX, 'vault');

    this.commands = Commands;

    this.hooks = {
      'vault:set:set': this.dispatchAction.bind(this, this.createSecret),
      'vault:get:get': this.dispatchAction.bind(this, this.fetchSecret),
      'vault:del:del': this.dispatchAction.bind(this, this.deleteSecret),
      'vault:auth:aws': this.dispatchAction.bind(this, this.setupAwsEnv),
      'after:package:cleanup': this.dispatchAction.bind(this, this.setupAwsEnv),
    };

    this.variableResolvers = {
      vault: {
        resolver: this.dispatchAction.bind(this, this.resolveSecret),
        serviceName: 'vault',
        isDisabledAtPrepopulation: true,
      },
    };

    // when you need to resolve many vars into serverless.yml
    // this should run once
    this.initialize = _.once(() => {
      this.loadConfig();

      if (!_.isEmpty(this.cfg.useToken)) {
        this.vault.useToken(this.cfg.useToken);
        return Promise.resolve();
      }

      this.log('Vault athenticating - getting token...');
      return this.vault.authenticate();
    });
  }

  /**
   * Action Wrapper check plugin condition before perform action
   *
   * @param {function} funAction serverless plugin action
   */
  async dispatchAction(funAction, varResolver) {
    if (this.isPluginDisabled()) {
      this.log('warning: plugin is disabled');
      return '';
    }

    await this.initialize();
    const res = await funAction.call(this, varResolver);
    return res;
  }

  /**
   * Load user config
   *
   */
  loadConfig() {
    this.cfg = {};
    this.cfg.aws = {};
    this.cfg.aws.setEnvVars = this.getConf('aws.setEnvVars', false, false);
    this.cfg.debugQuery = this.getConf('debugQuery', false, false);
    this.cfg.aws.secretPath = this.getConf('aws.secretPath');
    this.cfg.aws.respJsonKeyPath = this.getConf(
      'aws.respJsonKeyPath',
      false,
      'data.aws_access_key_id'
    );

    this.cfg.aws.respJsonSecretPath = this.getConf(
      'aws.respJsonSecretPath',
      false,
      'data.aws_secret_access_key'
    );

    this.cfg.useToken = this.getConf('auth.useToken', false);
    this.vault = new VaultService(
      this.getConf('host'),
      this.getConf('auth.roleId'),
      this.getConf('auth.secretId')
    );

    if (this.cfg.debugQuery) {
      this.vault.useRequestInterceptor((req) => {
        this.log(req);
        return req;
      });
    }
  }

  /**
   * Set up aws credentials environment
   *
   */
  async setupAwsEnv() {
    this.log('Fetching aws vault credentials...');
    const resp = await this.vault.fetchSecret(this.cfg.aws.secretPath);

    if (_.isEmpty(resp)) return;

    if (this.cfg.aws.setEnvVars) {
      const { respJsonSecretPath, respJsonKeyPath } = this.cfg.aws;
      const key = _.get(resp, respJsonKeyPath);
      const secret = _.get(resp, respJsonSecretPath);

      if (!key || !secret) {
        throw new Error(
          `Parsing response - invalid json path,
          please check the response and update your serverless.yml:
            vault.aws.respJsonSecretPath: "${respJsonSecretPath}"
            vault.aws.respJsonKeyPath: "${respJsonKeyPath}"`
        );
      }

      process.env.AWS_ACCESS_KEY_ID = key;
      process.env.AWS_SECRET_ACCESS_KEY = secret;

      const sensibleKey = key.substr(0, 3) + '*'.repeat(9) + key.substr(-2);
      this.log(`Vault credentials setted for "${sensibleKey}" aws access key`);
    }
  }

  /**
   * Resolve serverless.yml variable
   *
   * @param {string} rawSecret
   * @return {string} secret value
   */
  async resolveSecret(rawSecret) {
    let val = '';
    if (!_.isEmpty(rawSecret) && rawSecret.includes(':')) {
      const [, secretPath, valuePath] = rawSecret.split(':');

      try {
        // default response is a json object
        val = await this.vault.fetchSecret(secretPath);
      } catch (e) {
        ServerlessVaultPlugin.errorHandler(e);
      }

      // extract value from json object
      if (!_.isEmpty(valuePath)) {
        val = _.get(val, valuePath);
      }
    }

    return val;
  }

  /**
   * Fetch Secret for command line and print info in stdout
   *
   * @returns {promise}
   */
  async fetchSecret() {
    let res;
    const { secret } = this.options;

    this.log(`Fetching secret "${secret}"...`);

    if (secret) {
      try {
        res = await this.vault.fetchSecret(secret);
        this.log(res);
      } catch (e) {
        ServerlessVaultPlugin.errorHandler(e);
      }
    }

    return res;
  }

  /**
   * Create Secret and print info in stdout
   *
   * @returns {promise}
   */
  async createSecret() {
    let res;
    const { secret, jsondata } = this.options;
    let data;

    try {
      data = JSON.parse(jsondata);
    } catch (e) {
      throw new Error('Invalid "jsondata" command argument');
    }

    this.log(`Creating secret "${secret}"...`);

    try {
      res = await this.vault.createSecret(secret, data);
      this.log(res);
    } catch (err) {
      ServerlessVaultPlugin.errorHandler(err);
    }

    return res;
  }

  /**
   * Remove Secret and print info in stdout
   *
   * @returns {promise}
   */
  async deleteSecret() {
    let res;
    let data;
    const { secret, jsondata } = this.options;

    try {
      data = JSON.parse(jsondata);
    } catch (e) {
      throw new Error('Invalid "jsondata" command argument');
    }

    this.log(`Removing secret "${secret}"...`);
    try {
      res = await this.vault.deleteSecret(secret, data);
      this.log(res);
    } catch (err) {
      ServerlessVaultPlugin.errorHandler(err);
    }
    return res;
  }

  /**
   * Throws Errors Handlers for friendly messages.
   *
   * @static
   * @param {object} err the catch error variable
   * @returns {exception} the throw error
   */
  static errorHandler(err) {
    if (err && !_.isEmpty(err.message)) {
      const { message } = err;
      if (message && message.includes('403')) {
        throw new Error('403 - Permission error.. check your token scope');
      }
    }

    throw new Error(err);
  }
}

module.exports = ServerlessVaultPlugin;
