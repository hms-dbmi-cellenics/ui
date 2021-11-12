import _ from 'lodash';
import fake from '__test__/test-utils/constants';

const mockProjectTemplate = (idx) => ({
  uuid: `${fake.PROJECT_ID}-${idx}`,
  name: `${fake.PROJECT_NAME}-${idx}`,
  experiments: [`${fake.EXPERIMENT_ID}-${idx}`],
  samples: [],
  metadataKeys: [],
  createdDate: '0000-00-00T00:00:00.000Z',
  description: `Mock project ${idx}`,
  lastAnalyzed: '0000-00-00T00:00:00.000Z',
  lastModified: '0000-00-00T00:00:00.000Z',
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
