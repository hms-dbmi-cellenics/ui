import _ from 'lodash';
import fake from '__test__/test-utils/constants';

const mockProjectTemplate = (idx) => ({
  uuid: `${fake.PROJECT_ID}-${idx}`,
  name: `${fake.PROJECT_NAME}-${idx}`,
  experiments: [`${fake.EXPERIMENT_ID}-${idx}`],
  samples: [],
  metadataKeys: [],
  createdDate: fake.MOCK_DATETIME,
  description: `Mock project ${idx}`,
  lastAnalyzed: fake.MOCK_DATETIME,
  lastModified: fake.MOCK_DATETIME,
});

const generateMockProjects = (numProjects = 1, attrs = []) => {
  const mockProject = [];

  for (let idx = 0; idx < numProjects; idx += 1) {
    const newProject = _.merge(
      {},
      mockProjectTemplate(idx),
      attrs[idx] ?? {},
    );

    mockProject.push(newProject);
  }

  return mockProject;
};

export default generateMockProjects;
