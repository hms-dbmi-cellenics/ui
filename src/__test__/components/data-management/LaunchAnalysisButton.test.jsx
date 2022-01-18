import React from 'react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act } from 'react-dom/test-utils';
import {
  screen, render, waitFor, fireEvent,
} from '@testing-library/react';
import { runGem2s } from 'redux/actions/pipeline';

import PipelineStatus from 'utils/pipelineStatusValues';
import LaunchAnalysisButton from 'components/data-management/LaunchAnalysisButton';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentsState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';

import updateExperimentInfo from 'redux/actions/experimentSettings/updateExperimentInfo';
import { updateExperiment } from 'redux/actions/experiments';
import updateProject from 'redux/actions/projects/updateProject';

import UploadStatus from 'utils/upload/UploadStatus';
import generateGem2sParamsHash from 'utils/data-management/generateGem2sParamsHash';
import '__test__/test-utils/setupTests';

jest.mock('utils/data-management/generateGem2sParamsHash');
jest.mock('redux/actions/experimentSettings/updateExperimentInfo', () => jest.fn().mockReturnValue({ type: 'UPDATE_EXPERIMENT_INFO' }));
jest.mock('redux/actions/pipeline', () => ({
  runGem2s: jest.fn().mockReturnValue({ type: 'RUN_GEM2S' }),
}));
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockStore = configureMockStore([thunk]);

const projectName = 'Project 1';
const projectUuid = 'project-1-uuid';
const projectDescription = 'Some description';
const sample1Name = 'Sample 1';
const sample1Uuid = 'sample-1';
const sample2Name = 'Sample 2';
const sample2Uuid = 'sample-2';
const experiment1id = 'experiment-1';

const noDataState = {
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
    [experiment1id]: {
      ...experimentTemplate,
    },
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
  experiments: {
    ...noDataState.experiments,
    [experiment1id]: {
      ...experimentTemplate,
      ...noDataState.experiments[experiment1id],
      sampleIds: [sample1Uuid, sample2Uuid],
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

describe('LaunchAnalysisButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Process project button is disabled if not all sample metadata are inserted', async () => {
    const notAllMetadataInserted = {
      ...withDataState,
      samples: {
        ...withDataState.samples,
        [sample1Uuid]: {
          ...withDataState.samples[sample1Uuid],
          metadata: [''],
        },
      },
    };

    await act(async () => {
      render(
        <Provider store={mockStore(notAllMetadataInserted)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Process project button is disabled if there is no data', async () => {
    await act(async () => {
      render(
        <Provider store={mockStore(noDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Process project button is disabled if not all data are uploaded', async () => {
    const notAllDataUploaded = {
      ...withDataState,
      samples: {
        ...withDataState.samples,
        [sample1Uuid]: {
          ...withDataState.samples[sample1Uuid],
          files: {
            ...withDataState.samples[sample1Uuid].files,
            'features.tsv.gz': { valid: true, upload: { status: UploadStatus.UPLOADING } },
          },
        },
      },
    };

    await act(async () => {
      render(
        <Provider store={mockStore(notAllDataUploaded)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Process project button is enabled if there is data and all metadata for all samples are uplaoded', async () => {
    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).not.toBeDisabled();
  });

  it('Shows Go to Data Processing if there are no changes to the project (same hash)', async () => {
    generateGem2sParamsHash.mockReturnValueOnce('old-params-hash');

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Go to Data Processing')).toBeDefined();
    });
  });

  it('Shows Process project if there are changes to the project (different hash)', async () => {
    generateGem2sParamsHash.mockReturnValueOnce('new-params-hash');

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Process project')).toBeDefined();
    });
  });

  it('Dispatches request for GEM2S if there are changes to the project', async () => {
    generateGem2sParamsHash.mockReturnValueOnce('new-params-hash');

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Process project'));

    await waitFor(() => screen.getByText('Yes'));

    // fireEvent is used here instead of user event
    // because fireEvent does not check for pointer-events: none
    // whiich is checked by userEvents disables interaction with the button
    // See https://github.com/ant-design/ant-design/issues/31105
    fireEvent.click(screen.getByText('Yes'));

    expect(runGem2s).toHaveBeenCalled();
  });

  it('Does not dispatch request for GEM2S if there are no changes to the project', async () => {
    generateGem2sParamsHash.mockReturnValueOnce('old-params-hash');

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Go to Data Processing'));
    expect(runGem2s).not.toHaveBeenCalled();
  });

  it('Clicking launch analysis should dispatch the correct actions', async () => {
    generateGem2sParamsHash.mockReturnValueOnce('old-params-hash');

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Go to Data Processing'));
    expect(runGem2s).not.toHaveBeenCalled();

    // Updates experiment info
    expect(updateExperimentInfo).toHaveBeenCalled();
  });
});
