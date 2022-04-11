import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createMetadataTrack from '../../../../redux/actions/projects/createMetadataTrack';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';
import initialSamplesState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import {
  PROJECTS_METADATA_CREATE,
} from '../../../../redux/actionTypes/projects';
import { saveProject } from '../../../../redux/actions/projects';
import { saveSamples } from '../../../../redux/actions/samples';
import pushNotificationMessage from '../../../../utils/pushNotificationMessage';
import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('../../../../redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

describe('createMetadataTrack action', () => {
  const project1uuid = 'project1';
  const project2uuid = 'project2';
  const sample1uuid = 'sample1';
  const sample2uuid = 'sample2';

  const project1 = {
    ...projectTemplate,
    name: 'Project 1',
    uuid: 'project1',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
    samples: [sample1uuid],
  };

  const project2 = {
    ...projectTemplate,
    name: 'Project 2',
    uuid: 'project2',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
    samples: [sample2uuid],
  };

  const sample1 = {
    ...sampleTemplate,
    name: 'Sample 1',
    projectUuid: project1uuid,
    uuid: 'sample1',
  };

  const sample2 = {
    ...sampleTemplate,
    name: 'Sample 2',
    projectUuid: project2uuid,
    uuid: 'sample2',
  };

  const oneProjectState = {
    projects: {
      ...initialProjectState,
      ids: [project1.uuid],
      [project1.uuid]: project1,
    },
    samples: {
      ...initialSamplesState,
      [sample1.uuid]: sample1,
    },
  };

  const twoProjectsState = {
    projects: {
      ...initialProjectState,
      ids: [project1.uuid, project2.uuid],
      [project1.uuid]: project1,
      [project2.uuid]: project2,
    },
    samples: {
      ...initialSamplesState,
      [sample1.uuid]: sample1,
      [sample2.uuid]: sample2,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(oneProjectState);
    await store.dispatch(createMetadataTrack('Test track', project1.uuid));

    const actions = store.getActions();

    // It creates the new metadata
    expect(actions[0].type).toEqual(PROJECTS_METADATA_CREATE);
    expect(saveProject).toHaveBeenCalled();
  });

  it('Does not create metadata if save fails', async () => {
    saveProject.mockImplementation(() => async () => { throw new Error('some weird error'); });

    const store = mockStore(oneProjectState);
    await store.dispatch(createMetadataTrack('Test track', project1.uuid));

    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
    // It fires saves project
    expect(saveProject).toHaveBeenCalled();
  });

  it('Only save samples for the project', async () => {
    const store = mockStore(twoProjectsState);

    await store.dispatch(createMetadataTrack('Test track', project1.uuid));

    expect(saveSamples).toHaveBeenCalled();

    // It saves metadata only for the project's samples
    const callParams = saveSamples.mock.calls[0];

    // The call parameters should include the project's uuid
    expect(callParams[0]).toEqual(project1uuid);
    expect(callParams[0]).not.toEqual(project2uuid);

    // The call parameter should only include sample 1
    expect(Object.keys(callParams[1]).includes(sample1uuid)).toEqual(true);
    expect(Object.keys(callParams[1]).includes(sample2uuid)).toEqual(false);
  });
});
