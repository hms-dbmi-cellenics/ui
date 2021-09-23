import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, render } from '@testing-library/react';
import PipelineStatus from '../../../utils/pipelineStatusValues';
import LaunchAnalysisButton from '../../../components/data-management/LaunchAnalysisButton';
import initialProjectState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import initialSamplesState, { sampleTemplate } from '../../../redux/reducers/samples/initialState';
import initialExperimentsState from '../../../redux/reducers/experiments/initialState';
import initialExperimentSettingsState from '../../../redux/reducers/experimentSettings/initialState';
import { initialExperimentBackendStatus } from '../../../redux/reducers/backendStatus/initialState';
import UploadStatus from '../../../utils/upload/UploadStatus';

const mockStore = configureStore([thunk]);
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

describe('LaunchAnalysisButton', () => {
  it('Process project button is disabled if not all sample metadata are inserted', () => {
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

    render(
      <Provider store={mockStore(notAllMetadataInserted)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Launch analysis button is disabled if there is no data', () => {
    render(
      <Provider store={mockStore(noDataState)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Launch analysis button is disabled if not all data are uploaded', () => {
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

    render(
      <Provider store={mockStore(notAllDataUploaded)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    const button = screen.getByText('Process project').closest('button');

    expect(button).toBeDisabled();
  });

  it('Launch analysis button is enabled if there is data and all metadata for all samples are uplaoded', () => {
    render(
      <Provider store={mockStore(withDataState)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    const button = screen.getByText('Process project').closest('button');

    expect(button).not.toBeDisabled();
  });

  it('Shows Go to Data Processing if there are no changes to the project (same hash)', () => {
    jest.mock('../../../utils/data-management/generateGem2sParamsHash', () => jest.fn().mockReturnValue('old-params-hash'));

    render(
      <Provider store={mockStore(withDataState)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    expect(screen.findByText('Go to Data Processing')).toBeDefined();
  });

  it('Shows Process project if there are changes to the project (different hash)', () => {
    jest.mock('../../../utils/data-management/generateGem2sParamsHash', () => jest.fn().mockReturnValue('new-params-hash'));

    render(
      <Provider store={mockStore(withDataState)}>
        <LaunchAnalysisButton />
      </Provider>,
    );

    expect(screen.findByText('Process project')).toBeDefined();
  });
});
