/* eslint-disable no-param-reassign */
import produce from 'immer';

const deploymentInfoLoaded = produce((draft, action) => {
  const { environment, domainName } = action.payload;

  draft.environment = environment;
  draft.domainName = domainName;
});

export default deploymentInfoLoaded;
