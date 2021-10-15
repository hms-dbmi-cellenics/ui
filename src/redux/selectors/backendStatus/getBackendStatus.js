import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import { initialExperimentBackendStatus } from '../../reducers/backendStatus/initialState';

const getBackendStatus = (experimentId) => (state) => (
  state[experimentId] ?? initialExperimentBackendStatus
);

export default createMemoizedSelector(getBackendStatus);
