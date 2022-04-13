import _ from 'lodash';
import produce from 'immer';

import initialState from './initialState';

const samplesDelete = produce((draft, action) => {
  const { projectUuid, sampleUuids } = action.payload;

  _.pullAll(draft[projectUuid].samples, sampleUuids);
}, initialState);

export default samplesDelete;
