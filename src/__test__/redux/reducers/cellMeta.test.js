import cellMetaReducer from '../../../redux/reducers/cellMeta';
import initialState from '../../../redux/reducers/cellMeta/initialState';

import {
  CELL_META_ERROR,
  CELL_META_LOADED,
  CELL_META_LOADING,
} from '../../../redux/actionTypes/cellMeta';

describe('cellMeta', () => {
  const metaName = 'mitochondrialContent';
  it('Reduces identical state on unknown action', () => expect(
    cellMetaReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets loading state on expression loading action', () => {
    const newState = cellMetaReducer(initialState, {
      type: CELL_META_LOADING,
      payload: {
        metaName,
      },
    });

    expect(newState[metaName].loading).toEqual(true);
    expect(newState).toMatchSnapshot();
  });

  it('Sets loaded state on expression loading action', () => {
    const data = [1, 2, 3];
    const newState = cellMetaReducer(initialState, {
      type: CELL_META_LOADED,
      payload: {
        metaName,
        data,
      },
    });

    expect(newState[metaName].data).toEqual(data);
    expect(newState).toMatchSnapshot();
  });

  it('Sets error state on expression error action', () => {
    const error = 'error';
    const newState = cellMetaReducer(initialState, {
      type: CELL_META_ERROR,
      payload: {
        metaName,
        error,
      },
    });

    expect(newState[metaName].loading).toEqual(false);
    expect(newState[metaName].error).toEqual(error);
    expect(newState).toMatchSnapshot();
  });
});
