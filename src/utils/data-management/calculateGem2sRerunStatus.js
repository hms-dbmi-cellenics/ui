import pipelineStatusValues from 'utils/pipelineStatusValues';
import _ from 'lodash';

const calculateGem2sRerunStatus = (gem2sBackendStatus, activeExperiment) => {
  const { status, shouldRerun } = gem2sBackendStatus ?? {};

  const pipelineSuccessful = [
    pipelineStatusValues.SUCCEEDED, pipelineStatusValues.RUNNING,
  ].includes(status);

  const rerunReasons = [];
  if (!pipelineSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (shouldRerun) rerunReasons.push('the experiment samples/metadata have been modified');

  return ({
    rerun: _.isNil(activeExperiment.parentExperimentId) && (!pipelineSuccessful || shouldRerun),
    reasons: rerunReasons,
    complete: status === pipelineStatusValues.SUCCEEDED,
  });
};

export default calculateGem2sRerunStatus;
