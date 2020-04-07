![serverless](http://public.serverless.com/badges/v3.svg)
[![npm version](https://badge.fury.io/js/serverless-vault-custom-plugin.svg)](https://badge.fury.io/js/serverless-vault-custom-plugin)

### Installation
```bash
npm i -E serverless-vault-custom-plugin
```

### Usage

```yaml
plugins:
  - serverless-vault-custom-plugin

custom:
  secrets:
    aws: 'path/to/secret:data.value'
    dd: 'path/to/secret:data.manysecrets.secret.value'

  vault:
    host: vault.corp.com
    debugQuery: false                 # optional, log axios http request
    auth:
      roleId: 'xxx-xxxx-xxxxx-xx'     # recomment use ssm or something like that
      secretId: 'xx-xxx-xx-x-xxx'     # recommend use ssm or something like that
      # Or
      useToken: ""                    # optional, force request to use this token
    aws:
      setEnvVars: true
      secretPath: '/mi/project/dev/aws/creds'

  otherPluginConf:
    miOtherSecret: ${vault:${self:custom.secrets.dd}}
```
