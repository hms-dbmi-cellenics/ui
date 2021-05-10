import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createMetadataTrack from '../../../../redux/actions/projects/createMetadataTrack';
import initialState from '../../../../redux/reducers/projects';
import { PROJECTS_METADATA_CREATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('createMetadataTrack action', () => {
  const mockProject = {
    ...initialState,
    name: 'test project',
    uuid: '12345',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(createMetadataTrack('Test track', mockProject.uuid));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_METADATA_CREATE);
  });
});
