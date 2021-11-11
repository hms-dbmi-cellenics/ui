import fake from '__test__/test-utils/constants';

const generateMockProjects = (experimentId) => ([
  {
    uuid: `${fake.PROJECT_ID}-without-samples`,
    name: 'Project with samples',
    experiments: [experimentId],
    samples: [],
  },
  {
    uuid: `${fake.PROJECT_ID}-with-samples`,
    name: fake.PROJECT_NAME,
    experiments: [experimentId],
    samples: [],
  },
]);

export default generateMockProjects;
