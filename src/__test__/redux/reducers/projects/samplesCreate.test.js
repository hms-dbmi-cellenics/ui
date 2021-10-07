import _ from 'lodash';

import samplesCreateReducer from 'redux/reducers/projects/samplesCreate';

import { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialState, { projectTemplate } from 'redux/reducers/projects/initialState';

const projectUuid = 'project-1';

const newSample = {
  ...sampleTemplate,
  name: 'sampleName',
  uuid: 'uuid',
  projectUuid,
  type: '10x',
};

const project = {
  ...projectTemplate,
  name: 'test project',
  uuid: projectUuid,
  description: 'this is a test description',
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
};

const oneProjectState = {
  ...initialState,
  ids: [...initialState.ids, projectUuid],
  meta: {
    activeProjectUuid: projectUuid,
  },
  [project.uuid]: project,
};

describe('samplesCreate', () => {
  it('returns correct state if previous state was initial', () => {
    const newState = samplesCreateReducer(oneProjectState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });

  it('returns correct state when project already had a sample', () => {
    const projectWithSampleState = _.cloneDeep(oneProjectState);
    projectWithSampleState[projectUuid].samples.push('oldSampleUuid');

    const newState = samplesCreateReducer(oneProjectState, { payload: { sample: newSample } });

    expect(newState).toMatchSnapshot();
  });
});
