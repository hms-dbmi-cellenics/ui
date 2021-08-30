import { saveAs } from 'file-saver';
import { Storage } from 'aws-amplify';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName, bundleName) => {
  const bucketKey = `${activeProjectUuid}/${sampleUuid}/${fileName}`;

  const downloadedS3Object = await Storage.get(bucketKey, { download: true });

  const fileNameToSaveWith = bundleName.endsWith('.gz') ? bundleName : `${bundleName}.gz`;

  saveAs(downloadedS3Object.Body, fileNameToSaveWith);
};

export default downloadSingleFile;
