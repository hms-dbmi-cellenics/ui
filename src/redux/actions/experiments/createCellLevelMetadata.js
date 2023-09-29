import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import loadExperiments from 'redux/actions/experiments/loadExperiments';

const createCellLevelMetadata = (experimentId, body) => async (dispatch) => {
  try {
    const signedUploadUrl = await fetchAPI(
      `/v2/experiments/${experimentId}/cellLevel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    // refresh experiment & samples info to show new metadata
    await dispatch(loadExperiments());
    return signedUploadUrl;
  } catch (e) {
    handleError(e, e.userMessage);
  }
};

export default createCellLevelMetadata;
