import fetchAPI from 'utils/http/fetchAPI';
import pipelineStatus from 'utils/pipelineStatusValues';

const calculateGem2sRerunStatus = async (
  gem2sBackendStatus, experimentId,
) => {
  const gem2sStatus = gem2sBackendStatus?.status;
  const projectModified = await fetchAPI(`/v2/experiments/${experimentId}/rerunStatus`);

  const gem2sSuccessful = [
    pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
  ].includes(gem2sStatus);

  const rerunReasons = [];
  if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (projectModified) rerunReasons.push('the project samples/metadata have been modified');

  return ({
    rerun: !gem2sSuccessful || projectModified,
    reasons: rerunReasons,
  });
};

export default calculateGem2sRerunStatus;
