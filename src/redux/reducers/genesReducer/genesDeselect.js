import _ from 'lodash';

const genesDeselect = (state, action) => {
  const { genes } = action.payload;

  return {
    ...state,
    selected: _.difference(state.selected, genes),
  };
};

export default genesDeselect;
