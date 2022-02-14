/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const environmentHydrate = produce((draft, action) => {
  const { environment } = action.payload.networkResources;
  draft.environment = environment;
}, initialState);

export default environmentHydrate;
