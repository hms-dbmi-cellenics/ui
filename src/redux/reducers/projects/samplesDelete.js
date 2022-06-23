import _ from 'lodash';
import produce from 'immer';

import initialState from './initialState';

const samplesDelete = produce((draft, action) => {
  const { projectUuid, sampleIds } = action.payload;

  _.pullAll(draft[projectUuid].samples, sampleIds);
}, initialState);

export default samplesDelete;
