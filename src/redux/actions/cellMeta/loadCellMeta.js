import {
  CELL_META_LOADING,
  CELL_META_LOADED,
  CELL_META_ERROR,
} from '../../actionTypes/cellMeta';

import { fetchCachedWork } from '../../../utils/cacheRequest';

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

  try {
    const data = await fetchCachedWork(
      experimentId, 30, body, getState().experimentSettings.backendStatus.status.pipeline.startDate,
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
