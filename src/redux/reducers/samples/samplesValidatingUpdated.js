import { removed } from 'utils/arrayUtils';

const samplesValidatingUpdated = (state, action) => {
  const { experimentId, validating } = action.payload;

  let newValidating = [...state.meta.validating];

  if (validating && !newValidating.includes(experimentId)) {
    newValidating.push(experimentId);
  } else if (!validating) {
    newValidating = removed(experimentId, newValidating);
  }

  return {
    ...state,
    meta: {
      ...state.meta,
      validating: newValidating,
    },
  };
};

export default samplesValidatingUpdated;
