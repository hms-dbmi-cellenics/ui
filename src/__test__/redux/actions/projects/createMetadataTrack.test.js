import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import createMetadataTrack from 'redux/actions/experiments/createMetadataTrack';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';

import {
  PROJECTS_METADATA_CREATE,
} from 'redux/actionTypes/experiments';

import '__test__/test-utils/setupTests';

import { SAMPLES_UPDATE } from 'redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

describe('createMetadataTrack action', () => {
  const project1uuid = 'project1';
  const sample1uuid = 'sample1';

  const project1 = {
    ...projectTemplate,
    name: 'Project 1',
    uuid: 'project1',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
    samples: [sample1uuid],
  };

  const sample1 = {
    ...sampleTemplate,
    name: 'Sample 1',
    projectUuid: project1uuid,
    uuid: 'sample1',
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

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(oneProjectState);

    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));

    await store.dispatch(createMetadataTrack('Test track', project1.uuid));

    const trackKeyRCompatible = 'Test_track';

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([PROJECTS_METADATA_CREATE, SAMPLES_UPDATE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${project1.uuid}/metadataTracks/${trackKeyRCompatible}`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );
  });
});
