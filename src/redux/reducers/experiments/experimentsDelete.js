import _ from 'lodash';

const experimentsDelete = (state, action) => {
  const { experimentIds } = action.payload;

  const newIds = state.ids.filter((id) => !experimentIds.includes(id));
  const remainingExperiments = _.omit(state, experimentIds);
  delete remainingExperiments.ids;

  return {
    ids: newIds,
    ...remainingExperiments,
  };
};

export default experimentsDelete;
