module.exports = {
  vault: {
    usage: 'Vault client',
    commands: {
      auth: {
        usage: 'sls vault auth',
        lifecycleEvents: ['auth'],
        commands: {
          aws: { usage: 'sls vault auth', lifecycleEvents: ['env'] },
        },
      },

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
