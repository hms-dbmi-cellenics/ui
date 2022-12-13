import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const runSubsetExperiment = (experimentId, name, cellSetKeys) => async () => {
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/subset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          cellSetKeys,
        }),
      },
    );
  } catch (e) {
    handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);
  }
};

export default runSubsetExperiment;
