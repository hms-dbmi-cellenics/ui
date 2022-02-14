/* eslint-disable no-param-reassign */
import produce from 'immer';

const loadEnvironment = produce((draft, action) => {
  const { environment } = action.payload;
  draft.environment = environment;
});

export default loadEnvironment;
