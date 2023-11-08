import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

import pipelineStatusValues from 'utils/pipelineStatusValues';

describe('calculateGem2sRerunStatus', () => {
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
    shouldRerun: false,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('No rerun when gem2s is running with the latest params already', () => {
    const runningGem2sBackendStatus = {
      ...successfulGem2sBackendStatus,
      stopDate: null,
      completedSteps: [
        'DownloadGem',
      ],
      status: pipelineStatusValues.RUNNING,
      shouldRerun: false,
    };

    const {
      rerun, reasons,
    } = calculateGem2sRerunStatus(runningGem2sBackendStatus, experiment);

    expect(rerun).toEqual(false);
    expect(reasons).toEqual([]);
  });

  it('Rerun when gem2s failed', () => {
    const failedGem2sBackendStatus = {
      ...successfulGem2sBackendStatus,
      status: pipelineStatusValues.FAILED,
      shouldRerun: false,
    };

    const { rerun } = calculateGem2sRerunStatus(
      failedGem2sBackendStatus, experiment,
    );

    expect(rerun).toEqual(true);
  });

  it('No rerun when gem2s finished and its a normal experiment and shouldRerun is false', () => {
    const { rerun } = calculateGem2sRerunStatus(
      { ...successfulGem2sBackendStatus, shouldRerun: false },
      experiment,
    );

    expect(rerun).toEqual(false);
  });

  it('Rerun when gem2s finished and its a normal experiment and shouldRerun is true', () => {
    const { rerun } = calculateGem2sRerunStatus(
      { ...successfulGem2sBackendStatus, shouldRerun: true },
      experiment,
    );

    expect(rerun).toEqual(true);
  });

  it('No rerun when its a subset experiment', () => {
    const subsetExperiment = {
      ...experiment,
      parentExperimentId: 'mockParentExperimentId',
    };

    const { rerun } = calculateGem2sRerunStatus(
      { ...successfulGem2sBackendStatus, shouldRerun: true },
      subsetExperiment,
    );

    expect(rerun).toEqual(false);
  });
});
