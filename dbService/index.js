'use strict';
const aws = require('aws-sdk');
const config = require('../config.json');
let env, APP_NAME, BUCKET_NAME, TABLE_NAME, lambda, s3;

class DynamoDbServicePlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      copyData: {
        usage: 'Retrieves data from input-data bucket and inserts it into DynamoDb table created during deployment',
        lifecycleEvents: ['getList', 'getObjects', 'formattingObjects', 'insertIntoDb'],
      }
    };

    this.hooks = {
      'before:copyData:getList': setup.bind(null, serverless),
      'copyData:getList': getList.bind(null, serverless, options),
      'copyData:getObjects': getObjects.bind(null, serverless, options),
      'copyData:formattingObjects': formattingObjects.bind(null, serverless, options),
      'copyData:insertIntoDb': insertIntoDb.bind(null, serverless, options)
    };
    aws.config.update({
      accessKeyId: config.aws.accessKey,
      secretAccessKey: config.aws.secretKey,
      region: 'us-east-1'    
    });  
    
    lambda = new aws.Lambda();
    s3 = new aws.S3();
  }
}

const setup = (serverless) => {
  env = serverless.service.provider.environment;
  APP_NAME = env.APP_NAME;
  BUCKET_NAME = `${APP_NAME}-${env.BUCKET_NAME}`;
  TABLE_NAME = env.TABLE_NAME;
}


const getList = (serverless, options) => new Promise((resolve, reject) => {
  serverless.cli.log('Getting list...');

  s3.listObjectsV2({
    Bucket: BUCKET_NAME
  }, (err, data) => {
    if (err) {
      serverless.cli.log(err);
      reject(err);
    }
    serverless.variables.data = data;
    serverless.cli.log('done');
    resolve(data);
  });    
});

const getObjects = (serverless, options) => new Promise((resolve, reject) => {
  serverless.cli.log('Getting objects...');

  s3.getObject({
    Bucket: BUCKET_NAME,
    Key: getLastKey(serverless.variables.data.Contents)
  }, (err, data) => {
    if (err) {
      serverless.cli.log(err);
      reject(err);
    }
    serverless.variables.data = data;
    serverless.cli.log('done');
    resolve(data);
  });
});

const getLastKey = (objects) => {
  return objects[0].Key;
};

const formattingObjects = (serverless, options) => {
  serverless.cli.log('Formatting objects...');
  
  const dataArray = JSON.parse(serverless.variables.data.Body.toString());
  const formattedData = [];
  dataArray.forEach(data => {
    formattedData.push({
      PutRequest: {
        Item: {
          'userId': data._id,
          'age': data.age,
          'name': data.name
        }
      }
    });
  });

  serverless.cli.log('done');
  serverless.variables.data = formattedData;
};

const insertIntoDb = (serverless, options) => new Promise((resolve, reject) => {
  serverless.cli.log('Inserting objects...');

  const payload = {
    tableName: TABLE_NAME,
    payload: serverless.variables.data
  }

  lambda.invoke({
    FunctionName: `${APP_NAME}-dev-insertIntoDb`,
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

module.exports = DynamoDbServicePlugin;
