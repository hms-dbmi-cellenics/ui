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
import { runGem2s, runObj2s } from 'redux/actions/pipeline';

import PipelineStatus from 'utils/pipelineStatusValues';
import { sampleTech } from 'utils/constants';
import LaunchAnalysisButton from 'components/data-management/LaunchAnalysisButton';
import initialExperimentsState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';

import UploadStatus from 'utils/upload/UploadStatus';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import calculateQCRerunStatus from 'utils/data-management/calculateQCRerunStatus';
import '__test__/test-utils/setupTests';

jest.mock('redux/actions/experimentSettings/updateExperimentInfo', () => jest.fn().mockReturnValue({ type: 'UPDATE_EXPERIMENT_INFO' }));
jest.mock('redux/actions/pipeline', () => ({
  runGem2s: jest.fn().mockReturnValue({ type: 'RUN_GEM2S' }),
  runObj2s: jest.fn().mockReturnValue({ type: 'RUN_OBJ2S' }),
}));

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

jest.mock('utils/data-management/calculateGem2sRerunStatus');
jest.mock('utils/data-management/calculateQCRerunStatus');

const mockStore = configureMockStore([thunk]);

const experiment1id = 'experiment-1';
const experimentName = 'Experiment 1';
const experimentDescription = 'Some description';
const sample1Uuid = 'sample-1';
const sample1Name = 'Sample 1';
const sample2Uuid = 'sample-2';
const sample2Name = 'Sample 2';

const noDataState = {
  experiments: {
    ...initialExperimentsState,
    meta: {
      ...initialExperimentsState,
      activeExperimentId: experiment1id,
      loading: false,
    },
    ids: [experiment1id],
    [experiment1id]: {
      ...experimentTemplate,
      id: experiment1id,
      name: experimentName,
      description: experimentDescription,
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
          shouldRerun: true,
          status: PipelineStatus.NOT_CREATED,
        },
        pipeline: {
          shouldRerun: null,
          status: PipelineStatus.NOT_CREATED,
        },
        seurat: {
          shouldRerun: null,
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
      ...experimentTemplate,
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
          shouldRerun: null,
          status: PipelineStatus.SUCCEEDED,
        },
        seurat: {
          shouldRerun: null,
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
      ...experimentTemplate,
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
          shouldRerun: null,
          status: PipelineStatus.NOT_CREATED,
        },
        pipeline: {
          shouldRerun: null,
          status: PipelineStatus.NOT_CREATED,
        },
        seurat: {
          shouldRerun: false,
          status: PipelineStatus.SUCCEEDED,
        },
      },
    },
  },
};

const rerunState = { rerun: true, reasons: ['the project samples/metadata have been modified'], complete: true };
const notRerunState = { rerun: false, reasons: [], complete: true };

describe('LaunchAnalysisButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Process project button is disabled if not all sample metadata are inserted', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Process project button is disabled if not all samples are uploaded', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Process project button is disabled if not all cell level metadata is uploaded', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

    const notAllDataUploaded = {
      ...withDataState,
      experiments: {
        ...withDataState.experiments,
        [experiment1id]: {
          ...withDataState.experiments[experiment1id],
          cellLevelMetadata: { id: 'metadataBeingUploadedId', uploadStatus: UploadStatus.UPLOADING },
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

  it('Process project button is disabled if not all Seurat data is uploaded', async () => {
    const notAllSeuratDataUploaded = {
      ...withSeuratDataState,
      samples: {
        ...withSeuratDataState.samples,
        [sample1Uuid]: {
          ...withSeuratDataState.samples[sample1Uuid],
          files: {
            ...withSeuratDataState.samples[sample1Uuid].files,
            'r.rds': { valid: true, upload: { status: UploadStatus.UPLOADING } },
          },
        },
      },
    };

    await act(async () => {
      render(
        <Provider store={mockStore(notAllSeuratDataUploaded)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Process project button is enabled if there is data and all metadata for all samples are uplaoded', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Process project button is enabled if all Seurat data is uploaded', async () => {
    await act(async () => {
      render(
        <Provider store={mockStore(withSeuratDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    const button = screen.getByText('Process project').closest('button');

    expect(button).not.toBeDisabled();
  });

  it('Shows Go to Data Processing if there are no changes to the experiment (same hash)', async () => {
    calculateGem2sRerunStatus.mockReturnValue(notRerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Shows Go to Data Exploration if there are no changes to the Seurat experiment (same hash)', async () => {
    calculateGem2sRerunStatus.mockReturnValue(notRerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

    await act(async () => {
      render(
        <Provider store={mockStore(withSeuratDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Go to Data Exploration')).toBeDefined();
    });
  });

  it('Shows Process project if there are changes to the experiment', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Shows Process project if there are changes to the Seurat experiment (shouldRerun = true)', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

    await act(async () => {
      render(
        <Provider store={mockStore(withSeuratDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Process project')).toBeDefined();
    });
  });

  it('Dispatches request for GEM2S if there are changes to the experiment', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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
    // which is checked by userEvents disables interaction with the button
    // See https://github.com/ant-design/ant-design/issues/31105
    fireEvent.click(screen.getByText('Yes'));

    expect(runGem2s).toHaveBeenCalled();
  });

  it('Does not dispatch request for GEM2S if there are no changes to the experiment', async () => {
    calculateGem2sRerunStatus.mockReturnValue(notRerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

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

  it('Going to Data Processing should dispatch the correct actions', async () => {
    calculateGem2sRerunStatus.mockReturnValue(notRerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

    await act(async () => {
      render(
        <Provider store={mockStore(withDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    act(() => { userEvent.click(screen.getByText('Go to Data Processing')); });
    expect(runGem2s).not.toHaveBeenCalled();

    // Call on navigation to go
    expect(mockNavigateTo).toHaveBeenCalled();
  });

  it('Does dispatch a request to runObj2s for an unprocessed experiment', async () => {
    calculateGem2sRerunStatus.mockReturnValue(rerunState);
    calculateQCRerunStatus.mockReturnValue(notRerunState);

    const notProcessedSeuratDataState = {
      ...withSeuratDataState,
      backendStatus: {
        ...noDataState.backendStatus,
        seurat: {
          status: PipelineStatus.NOT_CREATED,
          shouldRerun: true,
        },
      },
    };

    await act(async () => {
      render(
        <Provider store={mockStore(notProcessedSeuratDataState)}>
          <LaunchAnalysisButton />
        </Provider>,
      );
    });

    userEvent.click(screen.getByText('Process project'));

    await waitFor(() => screen.getByText('Yes'));

    // fireEvent is used here instead of user event
    // because fireEvent does not check for pointer-events: none
    // which is checked by userEvents disables interaction with the button
    // See https://github.com/ant-design/ant-design/issues/31105
    fireEvent.click(screen.getByText('Yes'));

    expect(runGem2s).not.toHaveBeenCalled();
    expect(runObj2s).toHaveBeenCalled();
  });
});
