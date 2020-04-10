<p align="center">
  <img alt="Vault" src="https://user-images.githubusercontent.com/621906/78959793-6978f400-7ac2-11ea-98d4-e240012058a6.png">
</p>

![serverless](http://public.serverless.com/badges/v3.svg)
[![npm version](https://badge.fury.io/js/serverless-vault-custom-plugin.svg)](https://badge.fury.io/js/serverless-vault-custom-plugin)
[![npm downloads](https://img.shields.io/npm/dt/serverless-vault-custom-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-vault-custom-plugin)


### Installation
```bash
npm i -E serverless-vault-custom-plugin
```

### Features
```yaml
- Auth with roleId or use token 
- Variable Resolver
- Fetch and set aws credentials
- Command Line Support
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

### Command Line Support
```bash
$ sls vault --help
$ sls vault get --secret /relative/path/to/secret
$ sls vault del --secret /relative/path/to/secret
$ sls vault set --secret /relative/path/to/secret --jsondata '{"value":"some_token_or_cred"}'
```
