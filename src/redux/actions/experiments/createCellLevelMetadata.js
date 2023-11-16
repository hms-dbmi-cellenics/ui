import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import loadExperiments from 'redux/actions/experiments/loadExperiments';

const createCellLevelMetadata = (experimentId, body) => async (dispatch) => {
  try {
    const signedUploadUrlParams = await fetchAPI(
      `/v2/experiments/${experimentId}/cellLevelMeta`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    await dispatch(loadExperiments());
    return signedUploadUrlParams.data;
  } catch (e) {
    handleError(e, e.userMessage);
  }
};

export default createCellLevelMetadata;
