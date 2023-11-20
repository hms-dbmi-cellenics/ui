import unpackResult from 'utils/work/unpackResult';
import httpStatusCodes from 'utils/http/httpStatusCodes';
import parseResult from 'utils/work/parseResult';

const downloadFromS3 = async (taskName, signedUrl) => {
  const response = await fetch(signedUrl);

  // some WorkRequests like scType and runClustering do not upload data to S3
  // (nor return it via socket) instead they patch the cellsets through the API.
  // In those cases the workResults will not exist, and it's fine because data will
  // be updated through the cellsets.
  // the forbidden (in addition to the not found) is required because of how signed URLs work
  //  when you try to download a file from a signedUrl that doesn't exist you get a 403 forbidden
  // because the user is not authorized to access a file that does not exist
  if (response.status === httpStatusCodes.NOT_FOUND
    || response.status === httpStatusCodes.FORBIDDEN) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.text}`, { cause: response });
  }

  const unpackedResult = await unpackResult(response, taskName);
  const parsedResult = parseResult(unpackedResult, taskName);

  return parsedResult;
};

export default downloadFromS3;
