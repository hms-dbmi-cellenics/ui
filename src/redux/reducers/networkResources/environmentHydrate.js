/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const environmentHydrate = produce((draft, action) => {
  const { environment, domainName } = action.payload.networkResources;
  draft.environment = environment;
  draft.domainName = domainName;
}, initialState);

export default environmentHydrate;
