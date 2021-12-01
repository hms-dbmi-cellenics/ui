import { saveAs } from 'file-saver';
import { Storage } from 'aws-amplify';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName) => {
  const bucketKey = `${activeProjectUuid}/${sampleUuid}/${fileName}`;

  const downloadedS3Object = await Storage.get(bucketKey, { download: true });

  const fileNameToSaveWith = fileName.endsWith('.gz') ? fileName : `${fileName}.gz`;

  saveAs(downloadedS3Object.Body, fileNameToSaveWith);
};

export default downloadSingleFile;
