import fake from '__test__/test-utils/constants';

const generateMockProjects = (experimentId) => ([
  {
    uuid: fake.PROJECT_ID,
    name: fake.PROJECT_NAME,
    experiments: [experimentId],
    samples: [],
  },
]);

export default generateMockProjects;
