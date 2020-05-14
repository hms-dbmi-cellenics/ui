import { FETCH_CELL_SETS } from './actionType';

const fetchCellSetAction = (experimentId) => (
  {
    type: FETCH_CELL_SETS,
    data: { experimentId },
  }
);

// eslint-disable-next-line import/prefer-default-export
export { fetchCellSetAction };
