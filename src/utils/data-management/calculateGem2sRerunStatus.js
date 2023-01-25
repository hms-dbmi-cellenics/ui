import _ from 'lodash';

import pipelineStatus from 'utils/pipelineStatusValues';
import generateGem2sParamsHash from './generateGem2sParamsHash';

const calculateGem2sRerunStatus = (
  gem2sBackendStatus, activeExperiment, samples,
) => {
  const gem2sStatus = gem2sBackendStatus?.status;
  const existingParamsHash = gem2sBackendStatus?.paramsHash;

  const newParamsHash = generateGem2sParamsHash(
    activeExperiment,
    samples,
  );

  const projectHashEqual = existingParamsHash === newParamsHash;

  const gem2sSuccessful = [
    pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
  ].includes(gem2sStatus);

  const rerunReasons = [];
  if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (!projectHashEqual) rerunReasons.push('the project samples/metadata have been modified');
  return ({
    rerun: _.isNil(activeExperiment.parentExperimentId) && (!gem2sSuccessful || !projectHashEqual),
    paramsHash: newParamsHash,
    reasons: rerunReasons,
  });
};

export default calculateGem2sRerunStatus;
