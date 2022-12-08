import _ from 'lodash';
import React from 'react';

import { Provider } from 'react-redux';
import rootReducer from 'redux/reducers/index';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import { act } from 'react-dom/test-utils';
import { fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { screen, render, waitFor } from '@testing-library/react';

import * as createMetadataTrack from 'redux/actions/experiments/createMetadataTrack';
import * as updateValueInMetadataTrack from 'redux/actions/experiments/updateValueInMetadataTrack';
import * as cloneExperiment from 'redux/actions/experiments/cloneExperiment';
import * as loadExperiments from 'redux/actions/experiments/loadExperiments';
import * as setActiveExperiment from 'redux/actions/experiments/setActiveExperiment';

import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';

import PipelineStatus from 'utils/pipelineStatusValues';
import { sampleTech } from 'utils/constants';
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
  let mockedCreateMetadataTrack;
  let mockedUpdateValueInMetadataTrack;
  let mockedCloneExperiment;
  let mockedLoadExperiments;
  let mockedSetActiveExperiment;
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateMetadataTrack = jest.spyOn(createMetadataTrack, 'default');
    mockedUpdateValueInMetadataTrack = jest.spyOn(updateValueInMetadataTrack, 'default');
    mockedCloneExperiment = jest.spyOn(cloneExperiment, 'default');
    mockedLoadExperiments = jest.spyOn(loadExperiments, 'default');
    mockedSetActiveExperiment = jest.spyOn(setActiveExperiment, 'default');
  });

  it('Has a title, project ID and description', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        <ProjectDetails width={width} height={height} />
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
        <ProjectDetails width={width} height={height} />
      </Provider>,
    );

    expect(screen.getByText('Add samples')).toBeDefined();
    expect(screen.getByText('Add metadata')).toBeDefined();
    expect(screen.getByText('Download')).toBeDefined();
    expect(screen.getByText('Process project')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
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
    await act(async () => {
      render(
        <Provider store={store}>
          <ProjectDetails width={width} height={height} />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Add metadata'));

    const input = screen.getByDisplayValue('Track 1');
    fireEvent.change(input, { target: { value: 'myBrandNewMetadata' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockedCreateMetadataTrack).toBeCalledTimes(1);
    expect(mockedCreateMetadataTrack).toHaveBeenCalledWith('myBrandNewMetadata', 'experiment-1');
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

    expect(store.getState().experiments[experiment1id].metadataKeys).toEqual(['metadata-1']);
  });

  it('Creates a metadata column trimming whitespaces in its name', async () => {
    const store = createStore(rootReducer, _.cloneDeep(withDataState), applyMiddleware(thunk));
    await act(async () => {
      render(
        <Provider store={store}>
          <ProjectDetails width={width} height={height} />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Add metadata'));

    const input = screen.getByDisplayValue('Track 1');
    fireEvent.change(input, { target: { value: '  myBrandNewMetadata     ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockedCreateMetadataTrack).toBeCalledTimes(1);
    expect(mockedCreateMetadataTrack).toHaveBeenCalledWith('myBrandNewMetadata', 'experiment-1');
  });

  it('Trims whitespaces in metadata track values', async () => {
    const store = createStore(rootReducer, _.cloneDeep(withDataState), applyMiddleware(thunk));
    await act(async () => {
      render(
        <Provider store={store}>
          <ProjectDetails width={width} height={height} />
        </Provider>,
      );
    });

    // Add track column
    userEvent.click(screen.getByText('Add metadata'));
    fireEvent.keyDown(screen.getByDisplayValue('Track 1'), { key: 'Enter', code: 'Enter' });

    // Change track value for sample

    act(() => userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  myBrandNewMetadataWithWhitespaces     ' } });

    act(() => userEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(mockedUpdateValueInMetadataTrack).toHaveBeenCalledTimes(1);
    expect(mockedUpdateValueInMetadataTrack).toHaveBeenCalledWith('experiment-1', 'sample-1', 'metadata-1', 'myBrandNewMetadataWithWhitespaces');
  });

  it('Copy experiment button works', async () => {
    const store = mockStore(withDataState);
    await act(async () => {
      render(
        <Provider store={store}>
          <ProjectDetails width={width} height={height} />
        </Provider>,
      );
    });
    act(() => userEvent.click(screen.getByText('Copy')));
    expect(mockedCloneExperiment).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockedLoadExperiments).toHaveBeenCalledTimes(1));
    expect(mockedSetActiveExperiment).toHaveBeenCalledTimes(1);
  });
});
