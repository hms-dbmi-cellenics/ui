import {
  CELL_META_LOADING,
  CELL_META_LOADED,
  CELL_META_ERROR,
} from '../../actionTypes/cellMeta';

import { fetchCachedWork } from '../../../utils/cacheRequest';

const loadCellMeta = (
  experimentId, metaName,
) => async (dispatch, getState) => {
  const { loading } = getState().cellMeta[metaName];

  // Mapping between metaName : workName
  const plotWorkName = {
    mitochondrialContent: 'GetMitochondrialContent',
  };

  // If other data of the same plot is being loaded, don't dispatch.
  if (loading.length > 0) {
    return null;
  }

  // Dispatch loading state.
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
    const data = await fetchCachedWork(experimentId, 30, body);
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
