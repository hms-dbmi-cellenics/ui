import pipelineStatusValues from 'utils/pipelineStatusValues';
import generatePipelineParamsHash from './generatePipelineParamsHash';

const calculatePipelineRerunStatus = (
  pipelineBackendStatus, activeExperiment, samples,
) => {
  const pipelineStatus = pipelineBackendStatus?.status;
  const existingParamsHash = pipelineBackendStatus?.paramsHash;

  const newParamsHash = generatePipelineParamsHash(
    activeExperiment,
    samples,
  );

  const projectHashEqual = existingParamsHash === newParamsHash;

  const pipelineSuccessful = [
    pipelineStatusValues.SUCCEEDED, pipelineStatusValues.RUNNING,
  ].includes(pipelineStatus);

  const rerunReasons = [];
  if (!pipelineSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (!projectHashEqual) rerunReasons.push('the project samples/metadata have been modified');

  return ({
    rerun: !pipelineSuccessful || !projectHashEqual,
    paramsHash: newParamsHash,
    reasons: rerunReasons,
  });
};

export default calculatePipelineRerunStatus;
