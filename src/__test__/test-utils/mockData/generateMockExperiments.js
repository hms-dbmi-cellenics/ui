import _ from 'lodash';
import fake from '__test__/test-utils/constants';

const experimentFromTemplate = (idx) => (
  {
    id: `${fake.EXPERIMENT_ID}-${idx}`,
    name: `${fake.EXPERIMENT_NAME}-${idx}`,
    description: `Mock experiment ${idx}`,
    samplesOrder: [],
    metadataKeys: [],
    pipelines: {
      qc: {
        stateMachineArn: 'arn:aws:states:eu-west-1:000000000000:stateMachine:biomage-qc-development-mock997586f1bae0a6d5c5beed65663ec151test',
        executionArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-qc-development-mock997586f1bae0a6d5c5beed65663ec1519de4:422493f3-68a0-4ecb-8b17-0e8cd7a3test',
      },
      gem2s: {
        paramsHash: 'mock57f90e94eeaa82ee6fb7627110828f2etest',
        stateMachineArn: 'arn:aws:states:eu-west-1:000000000000:stateMachine:biomage-gem2s-development-mock997586f1bae0a6d5c5beed65663ec151test',
        executionArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-gem2s-development-mock997586f1bae0a6d5c5beed65663ec1519de4:5f273383-f093-4112-95b0-d76db896test',
      },
    },
    notifyByEmail: true,
    pipelineVersion: 1,
    createdAt: fake.MOCK_DATETIME,
    updatedAt: fake.MOCK_DATETIME,
  }
);

const generateMockExperiments = (
  numExperiments = 1,
  attrs = [],
) => {
  const experimentsList = [];

  _.times(numExperiments, (idx) => {
    const experiment = _.merge(
      {},
      experimentFromTemplate(idx),
      attrs[idx] ?? {},
    );

    experimentsList.push(experiment);
  });

  return experimentsList;
};

export default generateMockExperiments;
