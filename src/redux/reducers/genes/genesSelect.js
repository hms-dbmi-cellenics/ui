import _ from 'lodash';

const genesSelect = (state, action) => {
  const { genes } = action.payload;

  return {
    ...state,
    selected: _.union(state.selected, genes),
  };
};

export default genesSelect;
