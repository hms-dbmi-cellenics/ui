import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, applyMiddleware } from 'redux';
import _ from 'lodash';
import { fireEvent } from '@testing-library/dom';
import rootReducer from 'redux/reducers/index';
import * as createMetadataTrack from 'redux/actions/projects/createMetadataTrack';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';
import PipelineStatus from 'utils/pipelineStatusValues';
import UploadStatus from 'utils/upload/UploadStatus';
import ProjectDetails from 'components/data-management/ProjectDetails';
import '__test__/test-utils/setupTests';

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

const mockStore = configureStore([thunk]);
const width = 600;
const height = 400;
const projectName = 'Project 1';
const projectUuid = 'project-1-uuid';
const projectDescription = 'Some description';
const sample1Name = 'Sample 1';
const sample1Uuid = 'sample-1';
const sample2Name = 'Sample 2';
const sample2Uuid = 'sample-2';
const experiment1id = 'experiment-1';

const noDataState = {
  backendStatus: {
    'experiment-1': initialExperimentBackendStatus,
  },
  projects: {
    ...initialProjectState,
    meta: {
      ...initialProjectState.meta,
      activeProjectUuid: projectUuid,
      loading: false,
    },
    ids: [projectUuid],
    [projectUuid]: {
      ...projectTemplate,
      experiments: [experiment1id],
      uuid: projectUuid,
      name: projectName,
      description: projectDescription,
    },
  },
  experiments: {
    ...initialExperimentsState,
    ids: [experiment1id],
  },
  experimentSettings: {
    ...initialExperimentSettingsState,
  },
  samples: {
    ...initialSamplesState,
  },
  backendStatus: {
    [experiment1id]: {
      ...initialExperimentBackendStatus,
      status: {
        gem2s: {
          status: PipelineStatus.NOT_CREATED,
        },
        pipeline: {
          status: PipelineStatus.NOT_CREATED,
        },
      },
    },
  },
};

const withDataState = {
  ...noDataState,
  projects: {
    ...noDataState.projects,
    [projectUuid]: {
      ...noDataState.projects[projectUuid],
      samples: [sample1Uuid, sample2Uuid],
      metadataKeys: ['metadata-1'],
    },
  },
  samples: {
    ...noDataState.samples,
    [sample1Uuid]: {
      ...sampleTemplate,
      name: sample1Name,
      projectUuid,
      uuid: sample1Uuid,
      type: '10X Chromium',
      metadata: ['value-1'],
      fileNames: ['features.tsv.gz', 'barcodes.tsv.gz', 'matrix.mtx.gz'],
      files: {
        'features.tsv.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
        'barcodes.tsv.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
        'matrix.mtx.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
      },
    },

    [sample2Uuid]: {
      ...sampleTemplate,
      name: sample2Name,
      projectUuid,
      uuid: sample2Uuid,
      type: '10X Chromium',
      metadata: ['value-2'],
      fileNames: ['features.tsv.gz', 'barcodes.tsv.gz', 'matrix.mtx.gz'],
      files: {
        'features.tsv.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
        'barcodes.tsv.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
        'matrix.mtx.gz': { valid: true, upload: { status: UploadStatus.UPLOADED } },
      },
    },
  },
  backendStatus: {
    [experiment1id]: {
      ...initialExperimentBackendStatus,
      status: {
        gem2s: {
          paramsHash: 'old-params-hash',
          status: PipelineStatus.SUCCEEDED,
        },
        pipeline: {
          status: PipelineStatus.SUCCEEDED,
        },
      },
    },
  },
};

describe('ProjectDetails', () => {
  let metadataCreated;
  beforeEach(() => {
    jest.clearAllMocks();
    metadataCreated = jest.spyOn(createMetadataTrack, 'default');
  });
  it('Has a title, project ID and description', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    // Project name
    expect(screen.getByText(projectName)).toBeDefined();

    // Project uuid
    expect(screen.queryByText(projectUuid)).toBeDefined();

    // Description
    expect(screen.queryByText(projectDescription)).toBeDefined();
  });

  it('Has 4 buttons', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    expect(screen.getByText('Add samples')).toBeDefined();
    expect(screen.getByText('Add metadata')).toBeDefined();
    expect(screen.getByText('Download')).toBeDefined();
    expect(screen.getByText('Process project')).toBeDefined();
  });

  it('Add metadata button is disabled if there is no data', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    const metadataButton = screen.getByText('Add metadata').closest('button');

    expect(metadataButton).toBeDisabled();
  });

  it('Add metadata button is enabled if there is data', () => {
    render(
      <Provider store={mockStore(withDataState)}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    const metadataButton = screen.getByText('Add metadata').closest('button');

    expect(metadataButton).not.toBeDisabled();
  });

  it('Download dropdown is disabled if there are no samples', () => {
    const store = createStore(rootReducer, _.cloneDeep(noDataState), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );
    const downloadDropdown = screen.getByText('Download').closest('button');
    expect(downloadDropdown).toBeDisabled();
  });

  it('Shows all the samples that are uploaded', () => {
    render(
      <Provider store={mockStore(withDataState)}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    expect(screen.getByText(sample1Name)).toBeDefined();
    expect(screen.getByText(sample2Name)).toBeDefined();
  });

  it('Creates a metadata column', async () => {
    const store = createStore(rootReducer, _.cloneDeep(withDataState), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );
    const addMetadata = screen.getByText('Add metadata');
    userEvent.click(addMetadata);
    const field = screen.getByRole('textbox');
    userEvent.type(field, 'myBrandNewMetadata');
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(metadataCreated).toBeCalledTimes(1));
  });

  it('Cancels metadata creation', () => {
    const store = createStore(rootReducer, _.cloneDeep(withDataState), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );
    const addMetadata = screen.getByText('Add metadata');
    userEvent.click(addMetadata);
    const field = screen.getByRole('textbox');
    userEvent.type(field, 'somenewMeta');
    fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' });
    expect(store.getState().projects[projectUuid].metadataKeys).toEqual(['metadata-1']);
  });
});
