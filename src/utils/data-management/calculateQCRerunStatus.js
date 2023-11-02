import pipelineStatusValues from 'utils/pipelineStatusValues';

const calculateQCRerunStatus = (qcBackendStatus) => {
  const qcRerunReason = 'the cell level metadata file has changed since the experiment was last processed';

  return {
    rerun: qcBackendStatus.shouldRerun,
    reasons: qcBackendStatus.shouldRerun ? [qcRerunReason] : [],
    complete: qcBackendStatus.status === pipelineStatusValues.SUCCEEDED,
  };
};

export default calculateQCRerunStatus;
