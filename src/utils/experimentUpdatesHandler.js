import { updateProcessingSettings, updateBackendStatus } from '../redux/actions/experimentSettings';
// import loadEmbedding from '../redux/actions/embedding/loadEmbedding';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';
// import { loadCellSets, updateCellSetsClustering } from '../redux/actions/cellSets';
// import { saveCellSets } from '../redux/actions/cellSets';
import {
  CELL_SETS_CLUSTERING_UPDATED,
} from '../redux/actionTypes/cellSets';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  DATA: 'data_update',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  console.log('received new experiment update', experimentId, update);

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
    // this should be used to notify the UI that a request has changed and the UI is out-of-sync
    case updateTypes.DATA: {
      console.log('updateDebug');
      console.log(update);

      console.log('experimentIdDebug');
      console.log(experimentId);
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
    dispatch(updateProcessingSettings(experimentId, input.taskName, processingConfigUpdate));

    Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
      dispatch(updatePlotData(plotUuid, plotData));
    });

    // This is temporary, should be taken out eventually as it will be handled
    // once we clean up the redux store (which is the correct action to take here)
    // dispatch(loadEmbedding(experimentId, 'umap'));
    // dispatch(loadEmbedding(experimentId, 'tsne'));
  }
};

const onGEM2SUpdate = () => {

};

const onWorkerUpdate = (experimentId, update, dispatch) => {
  console.log('on data update, what to do, what to see');

  const reqName = update.response.request.body.name;

  console.log('request name', reqName);
  if (reqName === 'ClusterCells') {
    console.log('loading cell sets anew, a piece');
    // dispatch(loadEmbedding(experimentId, 'umap'));
    // dispatch(loadEmbedding(experimentId, 'tsne'));
    // dispatch(updateCellSetsClustering(experimentId, 0.5));
    // dispatch(loadCellSets(experimentId));

    const louvainSets = JSON.parse(update.response.results[0].body);
    console.log('NEW LOUVAIN SETS');
    console.log(louvainSets);
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
      // dispatch(saveCellSets(experimentId));
      console.log('saved new cell sets');
    } catch (e) {
      console.log('error on this louvain trial');
      // dispatch({
      //   type: CELL_SETS_ERROR,
      //   payload: {
      //     experimentId,
      //     error: e,
      //   },
      // });
    }
  }

  // switch (reqName) {
  //   case 'GetEmbeeding'
  // }
  // const responseData = JSON.parse(update.request.results[0].body);
};

export default experimentUpdatesHandler;
