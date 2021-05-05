import moment from 'moment';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  fileName,
  fileDiff,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid,
      lastModified: updatedAt,
      fileName,
      fileDiff,
    },
  });
};

export default updateSampleFile;
