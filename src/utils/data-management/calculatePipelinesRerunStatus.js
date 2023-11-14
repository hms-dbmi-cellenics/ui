import { runGem2s, runQC, runSeurat } from 'redux/actions/pipeline';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import calculateQCRerunStatus from 'utils/data-management/calculateQCRerunStatus';

const calculatePipelinesRerunStatus = (
  gem2sBackendStatus,
  qcBackendStatus,
  activeExperiment,
  isTechSeurat,
) => {
  const gem2sRerunStatus = calculateGem2sRerunStatus(gem2sBackendStatus, activeExperiment);
  const qcRerunStatus = calculateQCRerunStatus(qcBackendStatus, gem2sBackendStatus);

  if (gem2sRerunStatus.rerun) {
    return {
      runPipeline: isTechSeurat ? runSeurat : runGem2s,
      ...gem2sRerunStatus,
    };
  }

  if (isTechSeurat) {
    return {
      runPipeline: null,
      rerun: false,
      complete: true,
      reasons: [],
    };
  }

  return {
    runPipeline: runQC,
    ...qcRerunStatus,
  };
};

export default calculatePipelinesRerunStatus;
