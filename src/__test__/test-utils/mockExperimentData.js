import fake from '__test__/test-utils/constants';
import mockBackendStatus from '__test__/data/backend_status.json';

const generateMockExperimentData = (experimentId) => ([
  {
    experimentId,
    experimentName: `Experiment ${experimentId}`,
    meta: mockBackendStatus,
    projectId: fake.PROJECT_ID,
    sampleIds: [fake.SAMPLE_ID],
    notifyByEmail: true,
  },
]
);

export default generateMockExperimentData;
