export STAGE="develop"

export VAULT_HOST='vault.corp.cloud';
export VAULT_DEBUG_QUERY=true

# ---------
export VAULT_ROLEID='xxx-xxxxxxxxxx-xxxxxxx'
export VAULT_SECRETID='xxxxxxxxxx'
#OR
export VAULT_AUTH_USETOKEN = 'xxxx'
# ---------


export VAULT_AWS_SECRETPATH='/path/to/aws/cli'

# optionals
# default data.aws_secret_access_key
# default data.aws_access_key_id
export VAULT_AWS_RESPJSONKEYPATH='response.path.to.key'
export VAULT_AWS_RESPJSONSECRETPATH='response.path.to.secretkey'
