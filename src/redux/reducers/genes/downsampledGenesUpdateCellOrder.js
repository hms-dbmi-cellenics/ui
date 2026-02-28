import produce from 'immer';
import getInitialState from 'redux/reducers/genes/getInitialState';

const downsampledGenesUpdateCellOrder = produce(
  (draft, action) => {
    const { cellOrder, cellOrderUpdating = false, cellOrderSelectedPoints = null } = action.payload;

    // Immer allows direct mutation of draft
    if (!draft.expression.downsampled) {
      // eslint-disable-next-line no-param-reassign
      draft.expression.downsampled = getInitialState().expression.downsampled;
    }

    // Only update cellOrder if it's provided in the payload
    if (cellOrder !== undefined && cellOrder !== null) {
      console.log(`[downsampledGenesUpdateCellOrder] Updating cellOrder with ${cellOrder.length} cells`);
      // eslint-disable-next-line no-param-reassign
      draft.expression.downsampled.cellOrder = cellOrder;
    }
    // eslint-disable-next-line no-param-reassign
    draft.expression.downsampled.cellOrderUpdating = cellOrderUpdating;
    // eslint-disable-next-line no-param-reassign
    draft.expression.downsampled.cellOrderSelectedPoints = cellOrderSelectedPoints;
  },
  getInitialState(),
);

export default downsampledGenesUpdateCellOrder;
