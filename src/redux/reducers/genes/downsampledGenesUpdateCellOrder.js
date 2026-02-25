import produce from 'immer';
import getInitialState from 'redux/reducers/genes/getInitialState';

const downsampledGenesUpdateCellOrder = produce(
  (draft, action) => {
    const { cellOrder } = action.payload;

    // Immer allows direct mutation of draft
    if (!draft.expression.downsampled) {
      // eslint-disable-next-line no-param-reassign
      draft.expression.downsampled = getInitialState().expression.downsampled;
    }

    // eslint-disable-next-line no-param-reassign
    draft.expression.downsampled.cellOrder = cellOrder;
  },
  getInitialState(),
);

export default downsampledGenesUpdateCellOrder;
