// import fetchAPI from 'utils/http/fetchAPI';
import pipelineStatus from 'utils/pipelineStatusValues';

const calculateGem2sRerunStatus = async (
  gem2sBackendStatus,
) => {
  const { status: gem2sStatus, shouldRerun: experimentModified } = gem2sBackendStatus ?? {};

  const gem2sSuccessful = [
    pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
  ].includes(gem2sStatus);

  const rerunReasons = [];
  if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (experimentModified) rerunReasons.push('the experiment samples/metadata have been modified');

  return ({
    rerun: !gem2sSuccessful || experimentModified,
    reasons: rerunReasons,
  });
};

export default calculateGem2sRerunStatus;
