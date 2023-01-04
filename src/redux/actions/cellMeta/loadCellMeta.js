import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

import {
  CELL_META_LOADING,
  CELL_META_LOADED,
  CELL_META_ERROR,
} from '../../actionTypes/cellMeta';

const loadCellMeta = (
  experimentId, metaName,
) => async (dispatch, getState) => {
  const { loading, error } = getState().cellMeta[metaName];

  if (!loading && !error) {
    return null;
  }

  // Mapping between metaName : workName
  const plotWorkName = {
    mitochondrialContent: 'GetMitochondrialContent',
    doubletScores: 'GetDoubletScore',
    numOfGenes: 'GetNGenes',
    numOfUmis: 'GetNUmis',
  };

  dispatch({
    type: CELL_META_LOADING,
    payload: {
      metaName,
    },
  });

  const body = {
    name: plotWorkName[metaName],
  };

  const timeout = getTimeoutForWorkerTask(getState(), plotWorkName[metaName]);

  try {
    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );
    dispatch({
      type: CELL_META_LOADED,
      payload: {
        metaName,
        data,
      },
    });
  } catch (e) {
    dispatch({
      type: CELL_META_ERROR,
      payload: {
        metaName,
        error: `Couldn't fetch plot data for ${metaName}`,
      },
    });
  }
};

export default loadCellMeta;
