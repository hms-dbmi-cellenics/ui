import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

import pipelineStatusValues from 'utils/pipelineStatusValues';
import generateGem2sParamsHash from 'utils/data-management/generateGem2sParamsHash';

jest.mock('utils/data-management/generateGem2sParamsHash');

describe('calculateGem2sRerunStatus', () => {
  const oldParamsHash = 'mockParamsHash';

  const successfulGem2sBackendStatus = {
    startDate: '2023-01-13T01:01:10.574Z',
    stopDate: '2023-01-13T01:02:16.435Z',
    status: 'SUCCEEDED',
    error: false,
    completedSteps: [
      'DownloadGem',
      'PreProcessing',
      'EmptyDrops',
      'DoubletScores',
      'CreateSeurat',
      'PrepareExperiment',
      'UploadToAWS',
    ],
    paramsHash: oldParamsHash,
  };

  const experiment = {
    id: 'f5675a84-7d5b-4214-b774-dff7affca351',
    name: 'GSE183716 - Covid19 MISC',
    description: '',
    notifyByEmail: true,
    pipelineVersion: 2,
    createdAt: '2023-01-13 00:15:47.91693+00',
    updatedAt: '2023-01-13 00:15:47.91693+00',
    metadataKeys: [
      'Track_1',
    ],
    sampleIds: [
      '4c4e6b81-33d1-4fb5-b745-d5f23e1604b2',
    ],
    parentExperimentId: null,
  };

  const samples = {
    meta: {
      loading: false,
      error: false,
      saving: false,
      validating: [],
    },
    '4c4e6b81-33d1-4fb5-b745-d5f23e1604b2': {
      experimentId: 'f5675a84-7d5b-4214-b774-dff7affca351',
      metadata: {
        Track_1: 'N.A.',
      },
      createdDate: '2023-01-13 00:15:58.079506+00',
      name: 'WT1',
      lastModified: '2023-01-13 00:15:58.079506+00',
      files: {
        'matrix.mtx.gz': {
          size: 5079737,
          valid: true,
          name: 'matrix.mtx.gz',
          upload: {
            status: 'uploaded',
          },
        },
        'barcodes.tsv.gz': {
          size: 5331,
          valid: true,
          name: 'barcodes.tsv.gz',
          upload: {
            status: 'uploaded',
          },
        },
        'features.tsv.gz': {
          size: 279361,
          valid: true,
          name: 'features.tsv.gz',
          upload: {
            status: 'uploaded',
          },
        },
      },
      type: '10x',
      options: {},
      fileNames: [
        'matrix.mtx.gz',
        'barcodes.tsv.gz',
        'features.tsv.gz',
      ],
      uuid: '4c4e6b81-33d1-4fb5-b745-d5f23e1604b2',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('No rerun when gem2s is running', () => {
    generateGem2sParamsHash.mockReturnValueOnce(oldParamsHash);

    const runningGem2sBackendStatus = {
      ...successfulGem2sBackendStatus,
      stopDate: null,
      completedSteps: [
        'DownloadGem',
      ],
      status: pipelineStatusValues.RUNNING,
    };

    const {
      rerun, paramsHash: receivedParamsHash, reasons,
    } = calculateGem2sRerunStatus(runningGem2sBackendStatus, experiment, samples);

    expect(rerun).toEqual(false);
    expect(receivedParamsHash).toEqual(oldParamsHash);
    expect(reasons).toEqual([]);
  });

  it('Rerun when gem2s failed', () => {
    const failedGem2sBackendStatus = {
      ...successfulGem2sBackendStatus,
      status: pipelineStatusValues.FAILED,
    };

    generateGem2sParamsHash.mockReturnValueOnce(oldParamsHash);

    const { rerun } = calculateGem2sRerunStatus(
      failedGem2sBackendStatus, experiment, samples,
    );

    expect(rerun).toEqual(true);
  });

  it('No rerun when gem2s finished and its a normal experiment and paramsHash coincides', () => {
    generateGem2sParamsHash.mockReturnValueOnce(oldParamsHash);

    const { rerun } = calculateGem2sRerunStatus(
      successfulGem2sBackendStatus, experiment, samples,
    );

    expect(rerun).toEqual(false);
  });

  it('Rerun when gem2s finished and its a normal experiment and paramsHashes differ', () => {
    generateGem2sParamsHash.mockReturnValueOnce('newParamsHash');

    const { rerun } = calculateGem2sRerunStatus(
      successfulGem2sBackendStatus, experiment, samples,
    );

    expect(rerun).toEqual(true);
  });

  it('No rerun when its a subset experiment', () => {
    const newParamsHash = 'newParamsHash';

    const subsetExperiment = {
      ...experiment,
      parentExperimentId: 'mockParentExperimentId',
    };

    generateGem2sParamsHash.mockReturnValueOnce(newParamsHash);
    const {
      rerun, paramsHash: receivedParamsHash,
    } = calculateGem2sRerunStatus(successfulGem2sBackendStatus, subsetExperiment, samples);

    expect(rerun).toEqual(false);
    expect(receivedParamsHash).toEqual(newParamsHash);
  });
});
