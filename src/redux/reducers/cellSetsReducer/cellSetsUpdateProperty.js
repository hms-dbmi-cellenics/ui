import _ from 'lodash';

const cellSetsUpdateProperty = (state, action) => {
  const { key, dataUpdated } = action.payload;

  const newState = _.cloneDeep(state);

  _.merge(newState.properties[key], dataUpdated);

  return newState;
};

export default cellSetsUpdateProperty;
