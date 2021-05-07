import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const { projectUuid } = getState().samples[sampleUuid];

  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid,
      lastModified: updatedAt,
      file,
    },
  });

  dispatch(saveSamples(projectUuid));
};

export default updateSampleFile;
