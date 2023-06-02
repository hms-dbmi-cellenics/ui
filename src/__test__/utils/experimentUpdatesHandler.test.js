import experimentUpdatesHandler, { updateTypes } from 'utils/experimentUpdatesHandler';
import fake from '__test__/test-utils/constants';
import pushNotificationMessage from 'utils/pushNotificationMessage';

import { updateCellSetsClustering, loadCellSets } from 'redux/actions/cellSets';
import { updateProcessingSettingsFromQC, loadedProcessingConfig, updatePipelineVersion } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import { updatePlotData, replaceLoadedConfigs } from 'redux/actions/componentConfig';
import endUserMessages from 'utils/endUserMessages';

jest.mock('redux/actions/cellSets/updateCellSetsClustering');
jest.mock('redux/actions/experimentSettings', () => ({
  updateProcessingSettingsFromQC: jest.fn(),
  loadedProcessingConfig: jest.fn(),
  updatePipelineVersion: jest.fn(),
}));
jest.mock('redux/actions/backendStatus/updateBackendStatus');
jest.mock('redux/actions/componentConfig/updatePlotData');
jest.mock('redux/actions/cellSets/loadCellSets');
jest.mock('redux/actions/componentConfig/replaceLoadedConfigs');

jest.mock('utils/pushNotificationMessage');
jest.spyOn(global.console, 'error');

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

const mockBackendStatusError = {
  pipeline: {
    status: 'ERROR',
  },
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
  pipelineVersion: 2,
};

const mockGem2sUpdate = {
  type: updateTypes.GEM2S,
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

  it('Triggers properly for GEM2S updates ', () => {
    const mockUpdate = mockGem2sUpdate;

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - Update backend status
    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    const backendStatus = updateBackendStatus.mock.calls[0];
    expect(backendStatus).toMatchSnapshot();

    // Dispatch 2 - Loaded processingConfig
    const updateParams = loadedProcessingConfig.mock.calls[1];
    expect(updateParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Triggers properly for QC updates ', () => {
    const mockUpdate = mockQcUpdate;

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1 - Update backend status
    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    const backendStatus = updateBackendStatus.mock.calls[0];

    expect(backendStatus).toMatchSnapshot();

    // Dispatch 2 - update processin settings
    expect(updateProcessingSettingsFromQC).toHaveBeenCalledTimes(1);
    const updateParams = updateProcessingSettingsFromQC.mock.calls[0];
    expect(updateParams).toMatchSnapshot();

    // Dispatch 3 - update pipeline version
    expect(updatePipelineVersion).toHaveBeenCalledTimes(1);
    expect(updatePipelineVersion.mock.calls).toMatchSnapshot();

    // Dispatch 4 - update plot data
    expect(updatePlotData).toHaveBeenCalledTimes(1);
    const plotDataParams = updatePlotData.mock.calls[0];
    expect(plotDataParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(4);

    // Does not load cell sets
    expect(loadCellSets).not.toHaveBeenCalled();

    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Handles qc errors correctly with config update', () => {
    const mockUpdate = {
      ...mockQcUpdate,
      output: {
        ...mockQcUpdate.output,
        plotData: undefined,
      },
      response: mockError,
      status: mockBackendStatusError,
    };

    triggerExperimentUpdate(mockUpdate);

    // Performs all the updates it can
    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    expect(updateProcessingSettingsFromQC).toHaveBeenCalledTimes(1);
    expect(updatePipelineVersion).toHaveBeenCalledTimes(1);

    // Doesn't try to update the plot data
    expect(updatePlotData).not.toHaveBeenCalled();

    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toMatchSnapshot();
  });

  it('Handles qc errors correctly without config update', () => {
    const mockUpdate = {
      ...mockQcUpdate,
      output: undefined,
      response: mockError,
      status: mockBackendStatusError,
    };

    triggerExperimentUpdate(mockUpdate);

    // Performs all the updates it can
    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    expect(updatePipelineVersion).toHaveBeenCalledTimes(1);

    // Doesn't try to update the plot data or config
    expect(updateProcessingSettingsFromQC).not.toHaveBeenCalled();
    expect(updatePlotData).not.toHaveBeenCalled();

    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toMatchSnapshot();
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

    // Dispatch 1 - Update backend status
    expect(updateBackendStatus).toHaveBeenCalledTimes(1);
    const backendStatus = updateBackendStatus.mock.calls[0];
    expect(backendStatus).toMatchSnapshot();

    // Dispatch 2 - update plot data
    expect(updatePlotData).toHaveBeenCalledTimes(1);
    const plotDataParams = updatePlotData.mock.calls[0];
    expect(plotDataParams).toMatchSnapshot();

    // Dispatch 3 - update pipeline version
    expect(updatePipelineVersion).toHaveBeenCalledTimes(1);
    expect(updatePipelineVersion.mock.calls).toMatchSnapshot();

    // Dispatch 3 - load cellsets on pipeline finish
    expect(loadCellSets).toHaveBeenCalledTimes(1);
    const loadCellSetsParams = loadCellSets.mock.calls[0];
    expect(loadCellSetsParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(5);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
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

  it('Triggers properly for PlotConfigRefresh updates', () => {
    const normalizedMatrixConfig = {
      id: 'normalized-matrix',
      updatedConfig: {
        sample: [],
        louvain: [],
        metadata: [],
        scratchpad: [],
      },
    };

    const mockUpdate = {
      type: updateTypes.PLOT_CONFIG_REFRESH,
      updatedConfigs: [normalizedMatrixConfig],
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(replaceLoadedConfigs).toHaveBeenCalledTimes(1);

    expect(replaceLoadedConfigs).toHaveBeenCalledWith([normalizedMatrixConfig]);
  });
});
