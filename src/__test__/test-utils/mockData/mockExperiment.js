import _ from 'lodash';
import fake from '__test__/test-utils/constants';

const projectExperimentTemplate = (projectId, experimentId, experimentName, sampleIds) => (
  {
    lastViewed: fake.MOCK_DATETIME,
    apiVersion: '2.0.0-data-ingest-seurat-rds-automated',
    createdDate: fake.MOCK_DATETIME,
    meta: {
      pipeline: {
        stateMachineArn: 'arn:aws:states:eu-west-1:000000000000:stateMachine:biomage-qc-development-mock997586f1bae0a6d5c5beed65663ec151test',
        executionArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-qc-development-mock997586f1bae0a6d5c5beed65663ec1519de4:422493f3-68a0-4ecb-8b17-0e8cd7a3test',
      },
      gem2s: {
        paramsHash: 'mock57f90e94eeaa82ee6fb7627110828f2etest',
        stateMachineArn: 'arn:aws:states:eu-west-1:000000000000:stateMachine:biomage-gem2s-development-mock997586f1bae0a6d5c5beed65663ec151test',
        executionArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-gem2s-development-mock997586f1bae0a6d5c5beed65663ec1519de4:5f273383-f093-4112-95b0-d76db896test',
      },
      organism: null,
      type: '10x',
    },
    sampleIds,
    description: 'Analysis description',
    experimentId,
    projectId,
    experimentName,
  }
);

const generateMockProjectExperiments = (
  projectId,
  experimentId,
  experimentName,
  sampleIds = [],
  attrs = {},
) => _.merge(
  projectExperimentTemplate(
    projectId,
    experimentId,
    experimentName,
    sampleIds,
  ),
  attrs,
);

export default generateMockProjectExperiments;
