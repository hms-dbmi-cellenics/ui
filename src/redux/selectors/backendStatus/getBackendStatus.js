import initialExperimentBackendStatus from '../../reducers/backendStatus';

const getBackendStatus = (experimentId) => (state) => (
  state.backendStatus[experimentId] ?? initialExperimentBackendStatus
);

export default getBackendStatus;
