const aws = require('aws-sdk');
const dynamoDb = new aws.DynamoDB.DocumentClient({ region: 'us-east-1' });

module.exports.insertIntoDb = (event, context, callback) => {
  const params = {
    RequestItems: {}
  };
  params.RequestItems[event.tableName] = event.payload;
  
  dynamoDb.batchWrite(params,
    (err) => {
      if (err) {
        console.log(err);
        callback(err, null);
      } else {
        console.log(`Great success!`);
        callback(null, 'Success');
      }
    }
  );
};
