import _ from 'lodash';

const experimentsDelete = (state, action) => {
  let { experimentIds } = action.payload;

  if (!Array.isArray(experimentIds)) {
    // eslint-disable-next-line no-const-assign
    experimentIds = [experimentIds];
  }

  const newIds = state.ids.filter((id) => !experimentIds.includes(id));
  const remainingExperiments = _.omit(state, experimentIds);
  delete remainingExperiments.ids;

  return {
    ids: newIds,
    ...remainingExperiments,
  };
};

export default experimentsDelete;
