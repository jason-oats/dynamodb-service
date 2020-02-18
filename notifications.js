const aws = require('aws-sdk');
const s3 = new aws.S3();

module.exports.configureBucket = (event, context, callback) => {
    const params = {
        Bucket: event.bucketName,
        NotificationConfiguration: {
            TopicConfigurations: [
                {
                    Events: ['s3:ObjectCreated:*'],
                    TopicArn: process.env.INPUT_TOPIC_ARN
                }
            ] 
        }
    }

    s3.putBucketNotificationConfiguration(
        params,
        (err, res) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            console.log(res);
            callback(null, 'Bucket Notifications Configured');
        }
    )
}