import _ from 'lodash';
import React from 'react';

import { Provider } from 'react-redux';
import rootReducer from 'redux/reducers/index';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import {
  screen, render, waitFor, fireEvent,
} from '@testing-library/react';

import mockedCreateMetadataTrack from 'redux/actions/experiments/createMetadataTrack';
import mockedUpdateValueInMetadataTrack from 'redux/actions/experiments/updateValueInMetadataTrack';
import mockedCloneExperiment from 'redux/actions/experiments/cloneExperiment';
import mockedLoadExperiments from 'redux/actions/experiments/loadExperiments';
import mockedSetActiveExperiment from 'redux/actions/experiments/setActiveExperiment';

import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';

import PipelineStatus from 'utils/pipelineStatusValues';
import { sampleTech } from 'utils/constants';
import UploadStatus from 'utils/upload/UploadStatus';
import ProjectDetails from 'components/data-management/project/ProjectDetails';

import '__test__/test-utils/setupTests';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

jest.mock('redux/actions/experiments/createMetadataTrack', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));
jest.mock('redux/actions/experiments/updateValueInMetadataTrack', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));
jest.mock('redux/actions/experiments/cloneExperiment', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));
jest.mock('redux/actions/experiments/loadExperiments', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));
jest.mock('redux/actions/experiments/setActiveExperiment', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));

const mockStore = configureStore([thunk]);
const width = 600;
const height = 400;
const experiment1id = 'experiment-1';
const experimentName = 'Experiment 1';
const experimentDescription = 'Some description';
const sample1Name = 'Sample 1';
const sample1Uuid = 'sample-1';
const sample2Name = 'Sample 2';
const sample2Uuid = 'sample-2';

const noDataState = {
  experiments: {
    ...initialExperimentsState,
    ids: [experiment1id],
    meta: {
      activeExperimentId: experiment1id,
    },
    [experiment1id]: {
      id: experiment1id,
      name: experimentName,
      description: experimentDescription,
      notifyByEmail: true,
      createdAt: '2022-06-29 17:06:10.683568+00',
      updatedAt: '2022-06-29 17:06:10.683568+00',
      metadataKeys: [],
      sampleIds: [],
    },
  },
  experimentSettings: {
    ...initialExperimentSettingsState,
  },
  samples: {
    ...initialSamplesState,
  },
  backendStatus: {
    'experiment-1': initialExperimentBackendStatus,
    [experiment1id]: {
      ...initialExperimentBackendStatus,
      status: {
        gem2s: {
          status: PipelineStatus.NOT_CREATED,
        },
        pipeline: {
          status: PipelineStatus.NOT_CREATED,
        },
        seurat: {
          status: PipelineStatus.NOT_CREATED,
        },
      },
    },
  },
};

const withDataState = {
  ...noDataState,
  experiments: {
    ...noDataState.experiments,
    [experiment1id]: {
      ...noDataState.experiments[experiment1id],
      sampleIds: [sample1Uuid, sample2Uuid],
      metadataKeys: ['metadata-1'],
    },
  },
  samples: {
    ...noDataState.samples,
    [sample1Uuid]: {
      ...sampleTemplate,
      name: sample1Name,
      experimentId: experiment1id,
      uuid: sample1Uuid,
      type: sampleTech['10X'],
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
      experimentId: experiment1id,
      uuid: sample2Uuid,
      type: sampleTech['10X'],
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
          shouldRerun: true,
          status: PipelineStatus.SUCCEEDED,
        },
        pipeline: {
          status: PipelineStatus.SUCCEEDED,
        },
        seurat: {
          status: PipelineStatus.NOT_CREATED,
        },
      },
    },
  },
};

const withSeuratDataState = {
  ...noDataState,
  experiments: {
    ...noDataState.experiments,
    [experiment1id]: {
      ...noDataState.experiments[experiment1id],
      sampleIds: [sample1Uuid],
    },
  },
  samples: {
    ...noDataState.samples,
    [sample1Uuid]: {
      ...sampleTemplate,
      name: sample1Name,
      experimentId: experiment1id,
      uuid: sample1Uuid,
      type: sampleTech.SEURAT,
      fileNames: ['r.rds'],
      files: {
        'r.rds': { valid: true, upload: { status: UploadStatus.UPLOADED } },
      },
    },
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
        seurat: {
          paramsHash: 'old-params-hash',
          status: PipelineStatus.SUCCEEDED,
        },
      },
    },
  },
};

const projectDetailsFactory = createTestComponentFactory(ProjectDetails, { width, height });

describe('ProjectDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getMenuItems = async () => {
    const menu = await screen.getByText('Metadata');
    expect(menu).not.toBeDisabled();

    await act(async () => {
      userEvent.click(menu);
    });
    const propertyDropdown = screen.getByText('Sample level');

    await act(async () => {
      fireEvent.mouseOver(propertyDropdown);
    });
    await waitFor(() => screen.getByText('Create track'));

    const menuItems = {
      createTrack: screen.getByText('Create track'),
      uploadFile: screen.getByText('Upload file'),
      cellLevel: screen.getByText('Cell level'),
    };
    return menuItems;
  };

  it('Has a title, project ID and description', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    // Project name
    expect(screen.getByText(experimentName)).toBeDefined();

    // Project uuid
    expect(screen.queryByText(experiment1id)).toBeDefined();

    // Description
    expect(screen.queryByText(experimentDescription)).toBeDefined();
  });

  it('Has 5 buttons', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    expect(screen.getByText('Add data')).toBeDefined();
    expect(screen.getByText('Metadata')).toBeDefined();
    expect(screen.getByText('Download')).toBeDefined();
    expect(screen.getByText('Process project')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
  });

  it('metadata button is disabled if there is no data', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const metadataButton = screen.getByText('Metadata').closest('button');

    expect(metadataButton).toBeDisabled();
  });

  it('metadata button is enabled if there is data', () => {
    render(
      <Provider store={mockStore(withDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const metadataButton = screen.getByText('Metadata').closest('button');

    expect(metadataButton).not.toBeDisabled();
  });

  it('metadata button is disabled if it is Seurat', () => {
    render(
      <Provider store={mockStore(withSeuratDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const metadataButton = screen.getByText('Metadata').closest('button');

    expect(metadataButton).toBeDisabled();
  });

  it('metadata button is disabled for subset experiments', () => {
    const state = _.cloneDeep(withDataState);
    state.experiments[experiment1id].parentExperimentId = '736de01d-cb70-439a-9fdf-9b269a72fc67';
    state.experiments[experiment1id].isSubsetted = true;

    render(
      <Provider store={mockStore(state)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const metadataButton = screen.getByText('Metadata').closest('button');

    expect(metadataButton).toBeDisabled();
  });

  it('Creates a metadata column', async () => {
    render(
      <Provider store={mockStore(withDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const menuOptions = await getMenuItems();
    userEvent.click(menuOptions.createTrack);
    const input = screen.getByDisplayValue('Track 1');
    userEvent.type(input, '{selectall}{backspace}myBrandNewMetadata{enter}');

    expect(mockedCreateMetadataTrack).toBeCalledTimes(1);
    expect(mockedCreateMetadataTrack).toHaveBeenCalledWith('myBrandNewMetadata', 'experiment-1');
  });

  it('Cancels metadata creation', async () => {
    const store = mockStore(withDataState);
    render(
      <Provider store={store}>
        {projectDetailsFactory()}
      </Provider>,
    );

    const menuOptions = await getMenuItems();
    userEvent.click(menuOptions.createTrack);

    const input = screen.getByDisplayValue('Track 1');
    userEvent.type(input, '{selectall}{backspace}myBrandNewMetadata{esc}');

    expect(store.getState().experiments[experiment1id].metadataKeys).toEqual(['metadata-1']);
  });

  it('Creates a metadata column trimming whitespaces in its name', async () => {
    const store = mockStore(withDataState);
    await act(async () => {
      render(
        <Provider store={store}>
          {projectDetailsFactory()}
        </Provider>,
      );
    });

    const menuOptions = await getMenuItems();

    userEvent.click(menuOptions.createTrack);

    const input = screen.getByDisplayValue('Track 1');
    userEvent.type(input, '{selectall}{backspace}  myBrandNewMetadata     {enter}');

    expect(mockedCreateMetadataTrack).toBeCalledTimes(1);
    expect(mockedCreateMetadataTrack).toHaveBeenCalledWith('myBrandNewMetadata', 'experiment-1');
  });

  it('Trims whitespaces in metadata track values', async () => {
    const store = mockStore(withDataState);
    await act(async () => {
      render(
        <Provider store={store}>
          {projectDetailsFactory()}
        </Provider>,
      );
    });

    // Wait and ensure that the dropdown is available before clicking
    await waitFor(() => {
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });

    // Add track column
    const menuOptions = await getMenuItems();

    fireEvent.click(menuOptions.createTrack);
    fireEvent.keyDown(screen.getByDisplayValue('Track 1'), { key: 'Enter', code: 'Enter' });

    // Change track value for sample

    act(() => userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  myBrandNewMetadataWithWhitespaces     ' } });

    act(() => userEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(mockedUpdateValueInMetadataTrack).toHaveBeenCalledTimes(1);
    expect(mockedUpdateValueInMetadataTrack).toHaveBeenCalledWith('experiment-1', 'sample-1', 'metadata-1', 'myBrandNewMetadataWithWhitespaces');
  });

  it('Download dropdown is disabled if there are no samples', () => {
    const store = createStore(rootReducer, _.cloneDeep(noDataState), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        {projectDetailsFactory()}
      </Provider>,
    );
    const downloadDropdown = screen.getByText('Download').closest('button');
    expect(downloadDropdown).toBeDisabled();
  });

  it('Shows all the samples that are uploaded', async () => {
    render(
      <Provider store={mockStore(withDataState)}>
        {projectDetailsFactory()}
      </Provider>,
    );

    // Rows are rendered separately and they load their own data, so we need to wait for them
    await waitFor(() => {
      expect(screen.getByText(sample1Name)).toBeDefined();
      expect(screen.getByText(sample2Name)).toBeDefined();
    });
  });

  it('Copy experiment button works', async () => {
    const store = mockStore(withDataState);
    await act(async () => {
      render(
        <Provider store={store}>
          {projectDetailsFactory()}
        </Provider>,
      );
    });
    userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(mockedCloneExperiment).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockedLoadExperiments).toHaveBeenCalledTimes(1);
      expect(mockedSetActiveExperiment).toHaveBeenCalledTimes(1);
    });
  });
});
