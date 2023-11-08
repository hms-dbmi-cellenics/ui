import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import calculateQCRerunStatus from 'utils/data-management/calculateQCRerunStatus';

const calculatePipelinesRerunStatus = (gem2sBackendStatus, qcBackendStatus, activeExperiment) => {
  const gem2sRerunStatus = calculateGem2sRerunStatus(gem2sBackendStatus, activeExperiment);
  const qcRerunStatus = calculateQCRerunStatus(qcBackendStatus, gem2sBackendStatus);

  if (gem2sRerunStatus.rerun) return { type: 'gem2s', ...gem2sRerunStatus };

  return { type: 'qc', ...qcRerunStatus };
};

export default calculatePipelinesRerunStatus;
