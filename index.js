const _ = require('lodash');
const https = require('https');

const LOG_PREFFIX = '[ServerlessVaultPlugin] - ';

class ServerlessVaultPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    const disabled = this.getConfValue('disabled', false, false);
    if ((_.isBoolean(disabled) && disabled) || disabled === 'true') {
      this.log('plugin disabled');
      return;
    }

    this.hooks = {
      'before:aws:common:validate:validate': this.setEnvironmentCredentials.bind(
        this
      ),
    };
  }

  /**
   * Log to console
   * @param msg:string message to log
   */
  log(entity) {
    this.serverless.cli.log(
      LOG_PREFFIX + (_.isObject(entity) ? JSON.stringify(entity) : entity)
    );
  }

  /*
   * get flexible configuration value
   *
   * Order priority
   * 1- sls --vault-someprop=some_value
   * 2- in serverless.yaml
   *   custom
   *     vault:
   *       someprop: some_value
   *
   * 3- from environment variable
   *   export VAULT_SOMEPROP=some_value
   */
  getConfValue(key, required = true, defaultValue = undefined) {
    const fromEnv = (k) => process.env[k];
    const fromCmdArg = (k) => this.options[k];
    const fromYaml = (k) => _.get(this.serverless, `service.custom.${k}`);

    let val = fromCmdArg(`vault-${key}`);
    if (val) return val;

    val = fromEnv(`VAULT_${key}`.toUpperCase());
    if (val) return val;

    val = fromYaml(`vault.${key}`);
    if (val) return val;

    if (required && !defaultValue) {
      throw new Error(`property value for ${key} is missing.`);
    }

    return defaultValue;
  }

  initialize() {
    this.cfg = {};
    this.cfg.host = this.getConfValue('host');
    this.cfg.path = this.getConfValue('path');
    this.cfg.token = this.getConfValue('token', false, process.env.TOKEN);

    // vault json responses key path configurables
    this.cfg.jsonAccessPath = this.getConfValue(
      'jsonaccesspath',
      false,
      'data.aws_access_key_id'
    );
    this.cfg.jsonSecretPath = this.getConfValue(
      'jsonsecretpath',
      false,
      'data.aws_secret_access_key'
    );

    if (!this.cfg.token) throw new Error('vault token is missing');
  }

  vaultRequest() {
    return new Promise((resolve, reject) => {
      const { host, path, token } = this.cfg;

      const opts = {
        path,
        hostname: host,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Vault-Token': token,
        },
      };

      const req = https.request(opts, (res) => {
        res.on('data', (d) => {
          const resp = JSON.parse(d);
          const key = _.get(resp, this.cfg.jsonAccessPath);
          const secret = _.get(resp, this.cfg.jsonSecretPath);

          if (_.isEmpty(key) || _.isEmpty(secret)) {
            reject(new Error('wrong credentials or vault response is empty'));
          } else {
            resolve(resp);
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.end();
    });
  }

  setEnvironmentCredentials() {
    this.initialize();

    return this.vaultRequest().then((res) => {
      const key = _.get(res, this.cfg.jsonAccessPath);
      const secret = _.get(res, this.cfg.jsonSecretPath);

      process.env.AWS_ACCESS_KEY_ID = key;
      process.env.AWS_SECRET_ACCESS_KEY = secret;

      const protectkey = key.substr(0, 3) + '*'.repeat(9) + key.substr(-2);
      this.log(
        `Vault credentials setted for ${protectkey} aws access key`
      );
    });
  }
}

module.exports = ServerlessVaultPlugin;
