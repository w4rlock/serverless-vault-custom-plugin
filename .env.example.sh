export STAGE="develop"

export VAULT_HOST='vault.corp.cloud';
export VAULT_ROLEID='xxx-xxxxxxxxxx-xxxxxxx'
export VAULT_SECRETID='xxxxxxxxxx'
export VAULT_AWS_SECRETPATH='/path/to/aws/cli'

# optionals
# default data.aws_secret_access_key
# default data.aws_access_key_id
export VAULT_AWS_RESPJSONKEYPATH='response.path.to.key'
export VAULT_AWS_RESPJSONSECRETPATH='response.path.to.secretkey'
