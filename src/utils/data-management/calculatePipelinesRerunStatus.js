import { runGem2s, runQC, runObj2s } from 'redux/actions/pipeline';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import calculateQCRerunStatus from 'utils/data-management/calculateQCRerunStatus';

const calculatePipelinesRerunStatus = (
  gem2sBackendStatus,
  qcBackendStatus,
  activeExperiment,
  isObj2s,
) => {
  const gem2sRerunStatus = calculateGem2sRerunStatus(gem2sBackendStatus, activeExperiment);
  const qcRerunStatus = calculateQCRerunStatus(qcBackendStatus, gem2sBackendStatus);

  if (gem2sRerunStatus.rerun) {
    return {
      runPipeline: isObj2s ? runObj2s : runGem2s,
      ...gem2sRerunStatus,
    };
  }

  if (isObj2s) {
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
