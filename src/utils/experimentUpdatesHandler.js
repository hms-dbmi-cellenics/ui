import { updateProcessingSettings, updateBackendStatus } from '../redux/actions/experimentSettings';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

import {
  CELL_SETS_CLUSTERING_UPDATED, CELL_SETS_ERROR,
} from '../redux/actionTypes/cellSets';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORKER_DATA_UPDATE: 'workerDataUpdate',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  if (update.response?.error) {
    return;
  }

  switch (update.type) {
    case updateTypes.QC: {
      dispatch(updateBackendStatus(experimentId, update.status));
      return onQCUpdate(experimentId, update, dispatch);
    }
    case updateTypes.GEM2S: {
      dispatch(updateBackendStatus(experimentId, update.status));
      return onGEM2SUpdate(experimentId, update, dispatch);
    }
    case updateTypes.WORKER_DATA_UPDATE: {
      return onWorkerUpdate(experimentId, update, dispatch);
    }

    default: {
      console.log(`Error, unrecognized message type ${update.type}`);
    }
  }
};

const onQCUpdate = (experimentId, update, dispatch) => {
  const { input, output } = update;

  const processingConfigUpdate = output.config;
  if (processingConfigUpdate) {
    dispatch(
      updateProcessingSettings(
        experimentId,
        input.taskName,
        { [input.sampleUuid]: processingConfigUpdate },
      ),
    );

    Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
      dispatch(updatePlotData(plotUuid, plotData));
    });
  }
};

const onGEM2SUpdate = () => {

};

const onWorkerUpdate = (experimentId, update, dispatch) => {
  const reqName = update.response.request.body.name;

  if (reqName === 'ClusterCells') {
    const louvainSets = JSON.parse(update.response.results[0].body);
    const newCellSets = [
      louvainSets,
    ];
    try {
      dispatch({
        type: CELL_SETS_CLUSTERING_UPDATED,
        payload: {
          experimentId,
          data: newCellSets,
        },
      });
    } catch (e) {
      dispatch({
        type: CELL_SETS_ERROR,
        payload: {
          experimentId,
          error: e,
        },
      });
    }
  }
};

export default experimentUpdatesHandler;
