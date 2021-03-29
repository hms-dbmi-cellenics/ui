import moment from 'moment';

import {
  SAMPLES_FILE_UPDATE, SAMPLES_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  dispatch({
    type: SAMPLES_UPDATE,
    payload: {
      sampleUuid,
      sample: {
        lastModified: updatedAt,
      },
    },
  });

  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid,
      file,
    },
  });
};

export default updateSampleFile;
