const _ = require('lodash');
const VaultService = require('vault-es6-cli');
const BaseServerlessPlugin = require('base-serverless-plugin');

const LOG_PREFFIX = '[ServerlessVaultPlugin] - ';

class ServerlessVaultPlugin extends BaseServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options, LOG_PREFFIX, 'vault');

    this.hooks = {
      'vault:auth:auth': this.actionDispatcher.bind(
        this,
        this.setupAwsCredentials
      ),
      'vault:set:set': this.actionDispatcher.bind(this, this.createSecret),
      'vault:get:get': this.actionDispatcher.bind(this, this.fetchSecret),
      'vault:del:del': this.actionDispatcher.bind(this, this.deleteSecret),
      'after:package:cleanup': this.actionDispatcher.bind(
        this,
        this.setupAwsCredentials
      ),
    };

    this.commands = {
      vault: {
        usage: 'Vault client',
        commands: {
          auth: { usage: 'sls vault auth', lifecycleEvents: ['auth'] },
          set: {
            usage: 'sls set secret',
            lifecycleEvents: ['set'],
            options: {
              secret: { usage: 'path to secret', required: true },
              jsondata: { usage: 'secret data', required: true },
            },
          },
          get: {
            usage: 'sls get secret',
            lifecycleEvents: ['get'],
            options: {
              secret: { usage: 'Get secret value', required: true },
            },
          },
          del: {
            usage: 'sls del secret',
            lifecycleEvents: ['del'],
            options: {
              secret: { usage: 'Delete secret', required: true },
              jsondata: { usage: 'Secret json string data', required: true },
            },
          },
        },
      },
    };

    this.variableResolvers = {
      vault: {
        resolver: this.actionDispatcher.bind(this, this.resolveSecret),
        serviceName: 'vault',
        isDisabledAtPrepopulation: true,
      },
    };
  }

  /**
   * Action Wrapper check plugin condition before perform action
   *
   * @param {function} funAction serverless plugin action
   */
  async actionDispatcher(funAction) {
    if (this.isPluginDisabled()) {
      this.log('plugin is disabled');
      return;
    }

    this.initialize();

    this.log('Vault athenticating...');
    await this.vault.authenticate();
    await funAction.call(this);
  }

  /**
   * Initialize user config variables
   *
   */
  async initialize() {
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
  async setupAwsCredentials() {
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
      const [, secretPath] = rawSecret.split(':');
      val = await this.vault.fetchSecret(secretPath);
    }

    return val;
  }

  /**
   * Fetch Secret for command line and print info in stdout
   *
   */
  async fetchSecret() {
    const { secret } = this.options;

    this.log(`Fetching secret "${secret}"...`);

    if (secret) {
      const resp = await this.vault.fetchSecret(secret);
      this.log(resp);
    }
  }

  /**
   * Create Secret and print info in stdout
   *
   */
  async createSecret() {
    const { secret, jsondata } = this.options;
    let data;

    try {
      data = JSON.parse(jsondata);
    } catch (e) {
      throw new Error('Invalid json to data command argument');
    }

    this.log(`Creating secret "${secret}"...`);

    this.vault
      .createSecret(secret, data)
      .then((resp) => this.log(resp))
      .catch((err) => {
        const { message } = err;
        if (message && message.includes('403')) {
          throw new Error('permission error 403');
        }
        throw new Error(err);
      });
  }

  /**
   * Remove Secret and print info in stdout
   *
   */
  async deleteSecret() {
    const { secret, jsondata } = this.options;
    let data;

    try {
      data = JSON.parse(jsondata);
    } catch (e) {
      throw new Error('Invalid json to data command argument');
    }

    this.log(`Removing secret "${secret}"...`);
    this.vault
      .deleteSecret(secret, data)
      .then((resp) => this.log(resp))
      .catch((err) => {
        const { message } = err;
        if (message && message.includes('403')) {
          throw new Error('permission error 403');
        }
        throw new Error(err);
      });
  }
}

module.exports = ServerlessVaultPlugin;
