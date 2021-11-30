import _ from 'lodash';
import mockBackendStatus from '__test__/data/backend_status.json';

const generateMockExperimentData = (
  projectId,
  experimentId,
  experimentName,
  sampleIds,
  attrs = {},
) => [
  _.merge(
    {
      projectId,
      experimentId,
      experimentName,
      meta: mockBackendStatus,
      sampleIds,
      notifyByEmail: true,
    },
    attrs,
  ),
];

export default generateMockExperimentData;
