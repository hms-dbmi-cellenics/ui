import downloadType from './downloadTypes';

const prepareDownloadLink = async (
  Storage,
  environment,
  experimentId,
  type,
) => {
  if (!Object.values(downloadType).includes(type)) throw new Error('Invalid download type');

  const objectKey = `${experimentId}/r.rds`;

  const bucket = `processed-matrix-${environment}`;
  const downloadLink = await Storage.get(objectKey, { bucket, expired: 60 });

  return downloadLink;
};

export default prepareDownloadLink;
