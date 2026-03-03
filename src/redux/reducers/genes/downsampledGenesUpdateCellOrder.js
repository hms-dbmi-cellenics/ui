import produce from 'immer';
import getInitialState from 'redux/reducers/genes/getInitialState';

const downsampledGenesUpdateCellOrder = produce(
  (draft, action) => {
    const { cellOrderUpdating = false, cellOrderSelectedPoints = null } = action.payload;

    // Immer allows direct mutation of draft
    if (!draft.expression.downsampled) {
      // eslint-disable-next-line no-param-reassign
      draft.expression.downsampled = getInitialState().expression.downsampled;
    }

    // Track cellOrder computation state
    // eslint-disable-next-line no-param-reassign
    draft.expression.downsampled.cellOrderUpdating = cellOrderUpdating;
    // eslint-disable-next-line no-param-reassign
    draft.expression.downsampled.cellOrderSelectedPoints = cellOrderSelectedPoints;
  },
  getInitialState(),
);

export default downsampledGenesUpdateCellOrder;
