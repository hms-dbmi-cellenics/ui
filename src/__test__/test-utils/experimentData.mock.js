import fake from '__test__/test-utils/constants';
import mockBackendStatus from '__test__/test-utils/backendStatus.mock';

const mockExperimentData = {
  data: {
    experimentId: fake.EXPERIMENT_ID,
    experimentName: fake.EXPERIMENT_NAME,
    meta: mockBackendStatus,
    projectId: fake.PROJECT_ID,
    sampleIds: [fake.SAMPLE_ID],
  },
};

export default mockExperimentData;
