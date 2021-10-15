import { createSelector } from 'reselect';
import memoize from 'lru-memoize';

import { initialExperimentBackendStatus } from '../../reducers/backendStatus/initialState';

const combiner = (experimentId) => (state) => (
  state[experimentId] ?? initialExperimentBackendStatus
);

const makeGetBakendStatus = (experimentId) => createSelector(
  (state) => state,
  combiner(experimentId),
);

export default memoize()(makeGetBakendStatus);
