import { initialExperimentBackendStatus } from '../../reducers/backendStatus/initialState';

const getBackendStatus = (experimentId) => (state) => (
  state.backendStatus[experimentId] ?? initialExperimentBackendStatus
);

// eslint-disable-next-line import/prefer-default-export
export { getBackendStatus };
