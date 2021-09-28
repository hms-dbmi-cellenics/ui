import { initialExperimentBackendStatus } from '../../reducers/backendStatus/initialState';

const getBackendStatus = (experimentId) => (state) => (
  state[experimentId] ?? initialExperimentBackendStatus
);

export default getBackendStatus;
