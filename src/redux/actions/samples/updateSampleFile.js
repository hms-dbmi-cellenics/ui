import moment from 'moment';
import fetchAPI from '../../../utils/fetchAPI';
import messages from '../../../components/notification/messages';
import pushNotificationMessage from '../pushNotificationMessage';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  try {
    await fetchAPI(
      `/v1/samples/${sampleUuid}/file`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      },
    );

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid,
        lastModified: updatedAt,
        file,
      },
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 5));
  }
};

export default updateSampleFile;
