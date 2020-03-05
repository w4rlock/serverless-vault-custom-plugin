'use strict';

const _ = require('lodash');
const https = require('https');


class ServerlessVaultPlugin {
  constructor(serverless, options) {
    this.logPreffix = '[ServerlessVaultPlugin] - ';
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:aws:common:validate:validate': this.setEnvironmentCredentials.bind(this)
    }
  }

  /**
   * Log to console
   * @param msg:string message to log
   */
  log(msg) {
    this.serverless.cli.log(this.logPreffix + msg);
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
  getConfValue(key, required = true, default_value = undefined) {
    const fromEnv = k => process.env[k];
    const fromCmdArg = k => this.options[k];
    const fromYaml = k => _.get(this.serverless, `service.custom.${k}`);

    let val = fromCmdArg(`vault-${key}`);
    if (val) return val;

    val = fromEnv(`VAULT_${key}`.toUpperCase());
    if (val) return val;

    val = fromYaml(`vault.${key}`);
    if (val) return val;

    if (required && !default_value) {
      throw new Error(`property value for ${key} is missing.`)
    }

    return default_value;
  }



  initialize() {
    this.cfg = {}
    this.cfg.host = this.getConfValue('host');
    this.cfg.path = this.getConfValue('path');
    this.cfg.token = this.getConfValue('token', false,  process.env.TOKEN)

    //vault json responses key path configurables
    this.cfg.jsonAccessPath = this.getConfValue('jsonaccesspath', false, 'data.aws_access_key_id')
    this.cfg.jsonSecretPath = this.getConfValue('jsonsecretpath', false, 'data.aws_secret_access_key')

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

      const req = https.request(opts, res => {
        res.on('data', d => resolve(JSON.parse(d)));
      });

      req.on('error', error => reject(error));
      req.end();
    });
  }



  setEnvironmentCredentials() {
    this.initialize();

    return this.vaultRequest().then(res => {
      process.env.AWS_ACCESS_KEY_ID = _.get(res, this.cfg.jsonAccessPath);
      process.env.AWS_SECRET_ACCESS_KEY = _.get(res, this.cfg.jsonSecretPath);

      this.log('Environment vault credentials setted');
    });
  }
}


module.exports = ServerlessVaultPlugin;
