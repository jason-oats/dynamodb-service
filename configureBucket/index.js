'use strict';
const aws = require('aws-sdk');
const config = require('../config.json');
let lambda, env, APP_NAME, BUCKET_NAME;

class BucketConfigurationPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {      
      configureBucket: {
        usage: 'Configures S3 bucket to push ObjectCreated event notifications to SNS topic created during deployment',
        lifecycleEvents: ['configureBucket']
      }
    };

    this.hooks = {
      'before:configureBucket:configureBucket': setup.bind(null, serverless),
      'configureBucket:configureBucket': configureBucket.bind(null, serverless, options)
    };

    aws.config.update({
      accessKeyId: config.aws.accessKey,
      secretAccessKey: config.aws.secretKey,
      region: 'us-east-1'    
    });  
    
    lambda = new aws.Lambda();
  }
}

const setup = (serverless) => {
  env = serverless.service.provider.environment;
  APP_NAME = env.APP_NAME;
  BUCKET_NAME = `${APP_NAME}-${env.BUCKET_NAME}`;
}

const configureBucket = (serverless, options) => new Promise((resolve, reject) => {
  serverless.cli.log('Configuring bucket...');

  const payload = {
    bucketName: BUCKET_NAME
  };

  lambda.invoke({
    FunctionName: `${APP_NAME}-dev-configureBucket`,
    Payload: JSON.stringify(payload)
  }, (err, data) => {
    if (err) {
      serverless.cli.log('failed');
      serverless.cli.log(err);
      reject(err);
    } else {
      serverless.cli.log('done');
      resolve(data);
    }
  });
});

module.exports = BucketConfigurationPlugin;
