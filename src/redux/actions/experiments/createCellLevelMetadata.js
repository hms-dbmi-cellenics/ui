import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import dayjs from 'dayjs';
import { loadSamples } from '../samples';
import loadExperiments from './loadExperiments';

const createCellLevelMetadata = (experimentId, body) => async (dispatch) => {
  const createdAt = dayjs().toISOString();

  try {
    const uploadUrlParams = await fetchAPI(
      `/v2/experiments/${experimentId}/cellLevel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, createdAt }),
      },
    );

    // refresh experiment & samples info to show new metadata
    await dispatch(loadExperiments());
    await dispatch(loadSamples(experimentId));
    return uploadUrlParams;
  } catch (e) {
    handleError(e, e.userMessage);
  }
};

export default createCellLevelMetadata;
