/* eslint-disable no-param-reassign */
import produce from 'immer';

import _ from 'lodash';
import initialState from './initialState';

const samplesOptionsUpdate = produce((draft, action) => {
  const { sampleUuids, diff } = action.payload;

  sampleUuids.forEach((sampleUuid) => {
    const oldOption = draft[sampleUuid].options;
    draft[sampleUuid].options = _.merge(oldOption, diff);
  });
}, initialState);

export default samplesOptionsUpdate;
