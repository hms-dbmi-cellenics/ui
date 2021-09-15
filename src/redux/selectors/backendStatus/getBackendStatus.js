import { initialExperimentBackendStatus } from '../../reducers/backendStatus/initialState';

const getBackendStatus = (experimentId) => (state) => (
  state.backendStatus[experimentId] ?? initialExperimentBackendStatus
);

export default getBackendStatus;
