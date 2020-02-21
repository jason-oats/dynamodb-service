const aws = require('aws-sdk');
const sqs = new aws.SQS();

module.exports.handleInputNotification = (event, _context, callback) => {
    const messageObj = JSON.parse(((event.Records || [])[0] || {}).body || {}).Message;
    const filename = ((((JSON.parse(messageObj).Records || [])[0] || {}).s3 || {}).object || {}).key;

    const params = {
        QueueUrl: process.env.FILENAME_QUEUE_URL,
        MessageBody: filename
    };

    if (filename) {
        sqs.sendMessage(
            params,
            (err, response) => {
                if (err) {
                    console.log(err);
                    callback(err, null);
                }
                console.log('Messages received');
                callback(null, response);
            }
        );
    } else {
        callback(null, 'Message not triggered by put event');
    }
}

module.exports.processFiles = (event, _context, callback) => {
    console.log(event.Records[0].body);
    callback(null, 'Success');
}