import pipelineStatusValues from 'utils/pipelineStatusValues';

const calculateQCRerunStatus = (qcBackendStatus, gem2sBackendStatus) => {
  const qcRerunReason = 'the cell level metadata file has changed since the experiment was last processed';

  // If gem2s hasn't finished, qc doesn't require reruns because
  // it will be triggered automatically by gem2s finishing
  const rerun = gem2sBackendStatus.status === pipelineStatusValues.SUCCEEDED
    && qcBackendStatus.shouldRerun;

  return {
    rerun,
    reasons: qcBackendStatus.shouldRerun ? [qcRerunReason] : [],
    complete: qcBackendStatus.status === pipelineStatusValues.SUCCEEDED,
  };
};

export default calculateQCRerunStatus;
