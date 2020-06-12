<p align="center">
  <img alt="Vault" src="https://user-images.githubusercontent.com/621906/78959793-6978f400-7ac2-11ea-98d4-e240012058a6.png">
</p>

![serverless](http://public.serverless.com/badges/v3.svg)
[![npm version](https://badge.fury.io/js/serverless-vault-custom-plugin.svg)](https://badge.fury.io/js/serverless-vault-custom-plugin)
[![npm downloads](https://img.shields.io/npm/dt/serverless-vault-custom-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-vault-custom-plugin)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=278YCRJXTXLXJ)


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


### Plugin Configuration
```yaml
plugins:
  - serverless-vault-custom-plugin

custom:
  vault:
    host: vault.your.corp.com
    debugQuery: false                           # optional, log axios http request
    
    auth:
      # option 1
      roleId: 'xxx-xxxx-xxxxx-xx'               # optional
      secretId: 'xx-xxx-xx-x-xxx'               # optional

      # option 2
      useToken: ""                              # optional, force request to use this token
```


### Simple Example Usage (key => value)
```yaml

# Syntax ${vault:/secret/path:object.path.to.value}

custom:  
  mysql_user: ${vault:/develop/mysql_user}
  mysql_pass: ${vault:/develop/mysql_password}
```


### Example Handling Object response (key => object)
```yaml

# Syntax ${vault:/secret/path:response.path.to.value}

custom:  
  mysql_user: ${vault:/develop/mysql_creds:data.mysql.user}
  mysql_pass: ${vault:/develop/mysql_creds:data.mysql.password}
```



### Command Line CLI Support
```bash
$ sls vault --help
$ sls vault get --secret /relative/path/to/secret
$ sls vault del --secret /relative/path/to/secret
$ sls vault set --secret /relative/path/to/secret --jsondata '{"value":"some_token_or_cred"}'
```

## Donation
Donate helps me to continue adding new features or bugs fix. Every tiny cents help me a lot.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=278YCRJXTXLXJ)
