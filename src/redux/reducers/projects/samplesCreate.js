import produce from 'immer';

import initialState from './initialState';

const samplesCreate = produce((draft, action) => {
  const { sample } = action.payload;

  const { projectUuid, uuid: newSampleUuid } = sample;

  draft[projectUuid].samples.push(newSampleUuid);
}, initialState);

export default samplesCreate;
