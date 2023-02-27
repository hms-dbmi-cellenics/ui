import pipelineStatusValues from 'utils/pipelineStatusValues';
import _ from 'lodash';

const calculatePipelineRerunStatus = (pipelineBackendStatus, activeExperiment) => {
  const { status: pipelineStatus, shouldRerun } = pipelineBackendStatus ?? {};

  const pipelineSuccessful = [
    pipelineStatusValues.SUCCEEDED, pipelineStatusValues.RUNNING,
  ].includes(pipelineStatus);

  const rerunReasons = [];
  if (!pipelineSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (shouldRerun) rerunReasons.push('the experiment samples/metadata have been modified');

  return ({
    rerun: _.isNil(activeExperiment.parentExperimentId) && (!pipelineSuccessful || shouldRerun),
    reasons: rerunReasons,
    complete: pipelineStatus === pipelineStatusValues.SUCCEEDED,
  });
};

export default calculatePipelineRerunStatus;
