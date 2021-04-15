import moment from 'moment';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid,
      lastModified: updatedAt,
      file,
    },
  });
};

export default updateSampleFile;
