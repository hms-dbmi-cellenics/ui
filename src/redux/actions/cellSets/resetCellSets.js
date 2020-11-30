import {
  CELL_SETS_LOADING, CELL_SETS_LOADED, CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';
import sendWork from '../../../utils/sendWork';
import saveCellSets from './saveCellSets';

const REQUEST_TIMEOUT = 30;

// Not currently used, was previously used for resetting clusters. This is still
// a useful task though, we will probably use it for other things down the line
// (e.g. custom clustering).
const resetCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: 'louvain',
    cellSetKey: 'louvain',
    params: {},
  };

  dispatch({
    type: CELL_SETS_LOADING,
  });

  try {
    const response = await sendWork(
      experimentId, REQUEST_TIMEOUT, body,
    );

    const louvainSets = JSON.parse(response.results[0].body);
    const newCellSets = [
      louvainSets,
      {
        key: 'scratchpad',
        name: 'Scratchpad',
        rootNode: true,
      },
    ];
    await dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: newCellSets,
      },
    });
    dispatch(saveCellSets(experimentId));
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: "Couldn't reset cell sets to default.",
      },
    });
  }
};

export default resetCellSets;
