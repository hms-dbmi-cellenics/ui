import _ from 'lodash';

const samplesDelete = (state, action) => {
  const { sampleUuids } = action.payload;

  let updatedObject = null;
  updatedObject = _.omit(state, sampleUuids);

  return updatedObject;
};

export default samplesDelete;
