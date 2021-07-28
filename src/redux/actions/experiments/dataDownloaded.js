import {
  EXPERIMENTS_DATA_DOWNLOADED,
  EXPERIMENTS_DATA_DOWNLOAD_ERROR,
} from '../../actionTypes/experiments';

import downloadType from '../../../utils/downloadTypes';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const dataDownloaded = (
  type,
) => async (dispatch) => {
  try {
    if (!Object.values(downloadType).includes(type)) throw new Error('Invalid download type');

    dispatch({
      type: EXPERIMENTS_DATA_DOWNLOADED,
      payload: {
        type,
      },
    });
  } catch (e) {
    dispatch({
      type: EXPERIMENTS_DATA_DOWNLOAD_ERROR,
      payload: {
        type,
      },
    });

    pushNotificationMessage('error', endUserMessages.ERROR_DOWNLOADING_DATA);
  }
};

export default dataDownloaded;
