import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const runSubsetExperiment = (experimentId, newExperimentName, cellSetKeys) => async () => {
  try {
    const newExperimentId = await fetchAPI(
      `/v2/experiments/${experimentId}/subset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newExperimentName,
          cellSetKeys,
        }),
      },
    );

    return newExperimentId;
  } catch (e) {
    handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);
  }
};

export default runSubsetExperiment;
