import _ from 'lodash';
import produce from 'immer';

import initialState from './initialState';

const samplesDelete = produce((draft, action) => {
  const { experimentId, sampleIds } = action.payload;

  _.pullAll(draft[experimentId].samples, sampleIds);
}, initialState);

export default samplesDelete;
