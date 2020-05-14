import { LOAD_CELL_SETS } from './actionType';

// eslint-disable-next-line func-names
const loadCellSets = (experimentId) => function (dispatch, getState) {
  if (getState().cellSets.data) {
    return Promise.resolve();
  }

  fetch(`${process.env.REACT_APP_API_URL}/v1/experiments/${experimentId}/cellSets`).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: LOAD_CELL_SETS,
      data: json.cellSets,
    }),
  );
};

// eslint-disable-next-line import/prefer-default-export
export { loadCellSets };
