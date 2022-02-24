import experimentUpdatesHandler, { updateTypes } from 'utils/experimentUpdatesHandler';
import fake from '__test__/test-utils/constants';
import pushNotificationMessage from 'utils/pushNotificationMessage';

// import updateCellSetsClustering from 'redux/actions/cellSets/updateCellSetsClustering';
import { updateProcessingSettingsFromQC } from 'redux/actions/experimentSettings';
// import updateBackendStatus from 'redux/actions/backendStatus/updateBackendStatus';
import updatePlotData from 'redux/actions/componentConfig/updatePlotData';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

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
      status: 'SUCCEEDED',
    },
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

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it('Triggers properly for QC updates ', () => {
    const mockUpdate = mockQcUpdate;

    triggerExperimentUpdate(mockUpdate);

    // Dispatch 1
    expect(updateProcessingSettingsFromQC).toHaveBeenCalledTimes(1);
    const updateParams = updateProcessingSettingsFromQC.mock.calls[0];
    expect(updateParams).toMatchSnapshot();

    // Dispatch 2
    expect(updatePlotData).toHaveBeenCalledTimes(1);
    const plotDataParams = updatePlotData.mock.calls[0];
    expect(plotDataParams).toMatchSnapshot();

    // Dispatch 3
    expect(loadCellSets).toHaveBeenCalledTimes(1);
    const loadCellSetsParams = loadCellSets.mock.calls[0];
    expect(loadCellSetsParams).toMatchSnapshot();

    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(pushNotificationMessage).not.toHaveBeenCalled();
  });

  it.only('Throws error if there are errors in QC updates ', () => {
    const mockUpdate = {
      ...mockQcUpdate,
      response: mockError,
    };

    triggerExperimentUpdate(mockUpdate);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(updateProcessingSettingsFromQC).not.toHaveBeenCalledTimes();

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith(
      mockError.errorCode,
      mockError.userMessage,
    );
  });

  // it('', async () => {
  //   experimentUpdatesHandler();
  // });
});
