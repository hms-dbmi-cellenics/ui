import _ from 'lodash';

const samplesDelete = (state, action) => {
  const { sampleIds } = action.payload;

  let updatedObject = null;
  updatedObject = _.omit(state, sampleIds);

  return updatedObject;
};

export default samplesDelete;
