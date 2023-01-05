import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { setActiveExperiment } from 'redux/actions/experiments';

const runSubsetExperiment = (experimentId, newExperimentName, cellSetKeys) => async (dispatch) => {
  // const { navigateTo } = useAppRouter();
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
    dispatch(setActiveExperiment(newExperimentId));
    dispatch(loadBackendStatus(newExperimentId));

    return newExperimentId;
  } catch (e) {
    handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);
  }
};

export default runSubsetExperiment;
