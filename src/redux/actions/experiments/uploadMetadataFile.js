import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import { loadSamples } from '../samples';
import loadExperiments from './loadExperiments';

const uploadMetadataFile = (
  experimentId, data,
) => async (dispatch) => {
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/metadataTracks`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: data,
      },
    );

    // refresh experiment & samples info to show new metadata
    await dispatch(loadExperiments());
    await dispatch(loadSamples(experimentId));
  } catch (e) {
    handleError(e, e.userMessage);
  }
};

export default uploadMetadataFile;
