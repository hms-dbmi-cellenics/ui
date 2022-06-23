import _ from 'lodash';
import produce from 'immer';

import initialState from './initialState';

const samplesDelete = produce((draft, action) => {
  const { experimentId, sampleUuids } = action.payload;

  _.pullAll(draft[experimentId].sampleIds, sampleUuids);
}, initialState);

export default samplesDelete;
