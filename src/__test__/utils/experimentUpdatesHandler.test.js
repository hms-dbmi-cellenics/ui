import experimentUpdatesHandler, { updateTypes } from 'utils/experimentUpdatesHandler';
import fake from '__test__/test-utils/constants';
import pushNotificationMessage from 'utils/pushNotificationMessage';

import { updateCellSetsClustering, loadCellSets } from 'redux/actions/cellSets';
import { updateProcessingSettingsFromQC, loadedProcessingConfig } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import { updatePlotData } from 'redux/actions/componentConfig';
import endUserMessages from 'utils/endUserMessages';

jest.mock('redux/actions/cellSets/updateCellSetsClustering');
jest.mock('redux/actions/experimentSettings', () => ({
  updateProcessingSettingsFromQC: jest.fn(),
  loadedProcessingConfig: jest.fn(),
}));
jest.mock('redux/actions/backendStatus/updateBackendStatus');
jest.mock('redux/actions/componentConfig/updatePlotData');
jest.mock('redux/actions/cellSets/loadCellSets');

jest.mock('utils/pushNotificationMessage');

const mockDispatch = jest.fn();

const triggerExperimentUpdate = (update) => {
  const actionCreator = experimentUpdatesHandler(mockDispatch);
  actionCreator(fake.EXPERIMENT_ID, update);
};

const mockError = {
  error: true,
  errorCode: 'MOCK_ERROR_CODE',
  userMessage: 'mockUserMessage',
};

const mockQcUpdate = {
  type: updateTypes.QC,
  input: {
    taskName: 'mockTaskName',
    sampleUuid: 'mockSampleUuid',
  },
  output: {
    config: {
      processingConfigUpdate: {
        mockProcessingConfigUpdate: 'mockProcessingConfigUpdate',
      },
    },
    plotData: {
      mockPlotUuid: 'mockPlotData',
    },
  },
  response: {
    error: false,
  },
  status: {
    pipeline: {
      status: 'RUNNING',
    },
  },
};

const mockGem2sUpdate = {
  type: updateTypes.GEM2S,
  response: {
    error: false,
  },
  item: {
    processingConfig: {
      mockProcessingConfig: 'mockProcessingConfig',
    },
  },
  status: {
    pipeline: {
      status: 'RUNNING',
    },
  },
};

const mockWorkResponseUpdate = {
  type: updateTypes.WORK_RESPONSE,
  request: {
    body: {
      name: 'WorkResponse',
    },
  },
  response: {
    error: false,
  },
};

describe('ExperimentUpdatesHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Triggers properly for backend status updates', () => {
    const mockBackendStatusUpdate = {
      status: {
        pipeline: 'mockPipelinStatus',
        gem2s: 'mockGem2sStatus',
        worker: 'mockWorkerStatus',
      },
    };
    triggerExperimentUpdate(mockBackendStatusUpdate);

    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    const backendStatus = updateProcessingSettingsFromQC.mock.calls[0];
    expect(backendStatus).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Triggers properly for QC updates ', () => {
    const mockUpdate = mockQcUpdate;

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - update processin settings
    expect(updateProcessingSettingsFromQC).toHaveBeenCalledTimes(1);
    const updateParams = updateProcessingSettingsFromQC.mock.calls[0];
    expect(updateParams).toMatchSnapshot();

    // Dispatch 2 - update plot data
    expect(updatePlotData).toHaveBeenCalledTimes(1);
    const plotDataParams = updatePlotData.mock.calls[0];
    expect(plotDataParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(2);

    // Does not load cell sets
    expect(loadCellSets).not.toHaveBeenCalled();

    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Loads cell sets if QC pipeline completes ', () => {
    const mockUpdate = {
      ...mockQcUpdate,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
      },
    };

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - update processin settings
    expect(updateProcessingSettingsFromQC).toHaveBeenCalledTimes(1);
    const updateParams = updateProcessingSettingsFromQC.mock.calls[0];
    expect(updateParams).toMatchSnapshot();

    // Dispatch 2 - update plot data
    expect(updatePlotData).toHaveBeenCalledTimes(1);
    const plotDataParams = updatePlotData.mock.calls[0];
    expect(plotDataParams).toMatchSnapshot();

    // Dispatch 3 - load cellsets on pipeline finish
    expect(loadCellSets).toHaveBeenCalledTimes(1);
    const loadCellSetsParams = loadCellSets.mock.calls[0];
    expect(loadCellSetsParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Throws error if there are errors in QC updates ', () => {
    const mockUpdate = {
      ...mockQcUpdate,
      response: mockError,
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(updateProcessingSettingsFromQC).not.toHaveBeenCalled();
    expect(updatePlotData).not.toHaveBeenCalled();
    expect(loadCellSets).not.toHaveBeenCalled();

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'error',
      mockError.userMessage,
    );
  });

  it('Triggers properly for GEM2S updates ', () => {
    const mockUpdate = mockGem2sUpdate;

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - Loaded processingConfig
    expect(loadedProcessingConfig).toHaveBeenCalledTimes(1);
    const updateParams = loadedProcessingConfig.mock.calls[0];
    expect(updateParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Throws error if there are errors in GEM2S updates ', () => {
    const mockUpdate = {
      ...mockGem2sUpdate,
      response: mockError,
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(loadedProcessingConfig).not.toHaveBeenCalled();

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'error',
      mockError.userMessage,
    );
  });

  it('Triggers properly for WorkResponse - ClusterCells updates ', () => {
    const mockUpdate = {
      ...mockWorkResponseUpdate,
      request: {
        body: {
          name: 'ClusterCells',
        },
      },
    };

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - Update cell set clustering
    expect(updateCellSetsClustering).toHaveBeenCalledTimes(1);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'success',
      endUserMessages.SUCCESS_CELL_SETS_RECLUSTERED,
    );
  });

  it('Triggers properly for WorkResponse - GetExpressionCellSets updates ', () => {
    const mockUpdate = {
      ...mockWorkResponseUpdate,
      request: {
        body: {
          name: 'GetExpressionCellSets',
        },
      },
    };

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - Load cell sets
    expect(loadCellSets).toHaveBeenCalledTimes(1);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'success',
      endUserMessages.SUCCESS_NEW_CLUSTER_CREATED,
    );
  });

  it('Throws error if there are errors in WorkResponse updates ', () => {
    const mockUpdate = {
      ...mockWorkResponseUpdate,
      response: mockError,
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).not.toHaveBeenCalled();

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'error',
      mockError.userMessage,
    );
  });

  it('Throws specific error if GetExpressionCellSets returns empty cell set', () => {
    const mockUpdate = {
      ...mockWorkResponseUpdate,
      request: {
        body: {
          name: 'GetExpressionCellSets',
        },
      },
      response: {
        error: true,
        errorCode: 'R_WORKER_EMPTY_CELL_SET',
        userMessage: 'Can not create empty cell set',
      },
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).not.toHaveBeenCalled();

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      'error',
      endUserMessages.EMPTY_CLUSTER_NOT_CREATED,
    );
  });
});
