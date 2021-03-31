import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createSample from '../../../../redux/actions/samples/createSample';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { SAMPLES_CREATE } from '../../../../redux/actionTypes/samples';
import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('createSample action', () => {
  const mockSampleUuid = 'abc123';
  const mockProjectUuid = 'qwe234';

  const mockType = '10x Chromium';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockSampleUuid,
  };

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: mockProjectUuid,
  };

  const initialState = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid],
      [mockSampleUuid]: mockSample,
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid],
      [mockProjectUuid]: mockProject,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(createSample(mockProjectUuid, mockSample, mockType));

    // Create sample
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_CREATE);

    // Update project.samples
    const action2 = store.getActions()[1];
    expect(action2.type).toEqual(PROJECTS_UPDATE);
  });
});
