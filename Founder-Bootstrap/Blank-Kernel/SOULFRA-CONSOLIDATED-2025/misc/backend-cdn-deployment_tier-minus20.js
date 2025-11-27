
/**
 * 🌍 GLOBAL CDN DEPLOYMENT
 * Deploys platform globally with edge caching
 */

const AWS = require('aws-sdk');

class CDNDeployment {
  constructor() {
    this.s3 = new AWS.S3();
    this.cloudfront = new AWS.CloudFront();
    this.bucketName = 'soulfra-global-cdn';
  }

  async deployToGlobal(files) {
    const deployments = [];
    
    for (const [filename, content] of Object.entries(files)) {
      const params = {
        Bucket: this.bucketName,
        Key: filename,
        Body: content,
        ContentType: this.getContentType(filename),
        CacheControl: 'public, max-age=31536000' // 1 year cache
      };
      
      const upload = await this.s3.upload(params).promise();
      deployments.push(upload);
    }
    
    // Invalidate CloudFront cache
    await this.invalidateCache(['/*']);
    
    return deployments;
  }

  async invalidateCache(paths) {
    const params = {
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };
    
    return await this.cloudfront.createInvalidation(params).promise();
  }

  getContentType(filename) {
    const ext = filename.split('.').pop();
    const types = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg'
    };
    return types[ext] || 'application/octet-stream';
  }
}

module.exports = CDNDeployment;