import produce from 'immer';
import getInitialState from 'redux/reducers/genes/getInitialState';

const downsampledGenesUpdateCellOrder = produce(
  (draft, action) => {
    const { componentUuid, cellOrder } = action.payload;

    if (!draft.expression.downsampled) {
      draft.expression.downsampled = getInitialState().expression.downsampled;
    }

    draft.expression.downsampled.cellOrder = cellOrder;
  },
  getInitialState(),
);

export default downsampledGenesUpdateCellOrder;
