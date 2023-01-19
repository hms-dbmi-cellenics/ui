import _ from 'lodash';

import pipelineStatus from 'utils/pipelineStatusValues';

const calculateGem2sRerunStatus = (gem2sBackendStatus, activeExperiment) => {
  const { status: gem2sStatus, shouldRerun } = gem2sBackendStatus ?? {};

  const gem2sSuccessful = [
    pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
  ].includes(gem2sStatus);

  const rerunReasons = [];
  if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (shouldRerun) rerunReasons.push('the experiment samples/metadata have been modified');

  return ({
    rerun: _.isNil(activeExperiment.parentExperimentId) && (!gem2sSuccessful || shouldRerun),
    reasons: rerunReasons,
  });
};

export default calculateGem2sRerunStatus;
