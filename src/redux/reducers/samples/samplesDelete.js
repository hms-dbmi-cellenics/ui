import _ from 'lodash';

const samplesDelete = (state, action) => {
  const { sampleUuid } = action.payload;

  let updatedObject = null;

  if (!_.has(state, sampleUuid)) {
    return state;
  }

  updatedObject = _.omit(state, sampleUuid);
  updatedObject.ids = updatedObject.ids.filter((p) => p !== sampleUuid);

  return updatedObject;
};

export default samplesDelete;
