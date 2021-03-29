import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch) => {
  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid,
      file,
    },
  });
};

export default updateSampleFile;
