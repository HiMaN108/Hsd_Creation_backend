export default () => ({
  services: {
    mailgun: {
      domain: process.env.MAILGUN_DOMAIN,
      secret: process.env.MAILGUN_SECRET,
      endpoint: process.env.MAILGUN_ENDPOINT || 'api.mailgun.net',
      scheme: 'https',
    },

    postmark: {
      token: process.env.POSTMARK_TOKEN,
    },

    ses: {
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },

    jwt: {
      secret: process.env.JWT_SECRET || 'supersecret',
    },
  },
});
