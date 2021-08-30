import { Storage } from 'aws-amplify';

const downloadFromS3 = async (bucketKey) => {
  const downloadedS3Object = await Storage.get(bucketKey, { download: true });

  return downloadedS3Object;
};

export default downloadFromS3;
