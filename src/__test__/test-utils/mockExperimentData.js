import fake from '__test__/test-utils/constants';
import mockBackendStatus from '__test__/data/backend_status.json';

const generateMockExperimentData = (experimentId) => ({
  data: {
    experimentId,
    experimentName: `Experiment ${experimentId}`,
    meta: mockBackendStatus,
    projectId: fake.PROJECT_ID,
    sampleIds: [fake.SAMPLE_ID],
  },
});

export default generateMockExperimentData;
