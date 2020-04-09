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
    otherPluginSecret: 'path/to/secret:response.path.to.object.property'

  vault:
    host: vault.your.corp.com
    debugQuery: false                 # optional, log axios http request
    auth:
      # option 1
      roleId: 'xxx-xxxx-xxxxx-xx'     # optional, recommend use ssm or something like that
      secretId: 'xx-xxx-xx-x-xxx'     # optional, recommend use ssm or something like that

      # option 2
      useToken: ""                    # optional, force request to use this token

    aws:
      setEnvVars: true
      secretPath: '/mi/project/dev/aws/creds'

  # HOW TO RESOLVE ANOTHER SECRET
  #otherPluginConf:
    #secret: ${vault:${self:custom.secrets.otherPluginSecret}}
```
