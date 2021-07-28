import { saveAs } from 'file-saver';
import {
  EXPERIMENTS_DATA_DOWNLOAD_REQUESTED,
  EXPERIMENTS_DATA_DOWNLOAD_STARTED,
  EXPERIMENTS_DATA_DOWNLOAD_ERROR,
} from '../../actionTypes/experiments';

import fetchAPI from '../../../utils/fetchAPI';
import downloadType from '../../../utils/downloadTypes';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const downloadExperimentData = (
  experimentId,
  type,
) => async (dispatch, getState) => {
  try {
    if (!Object.values(downloadType).includes(type)) throw new Error('Invalid download type');

    const downloadUrl = `/v1/experiments/${experimentId}/download/${type}`;
    const filename = `${experimentId}.rds`;

    const downloadStatus = getState().experiments.meta.download[type] || {};

    if (downloadStatus?.loading) {
      pushNotificationMessage('loading', endUserMessages.DOWNLOAD_IN_PROGRESS);
      return;
    }

    dispatch({
      type: EXPERIMENTS_DATA_DOWNLOAD_REQUESTED,
      payload: {
        type,
      },
    });

    pushNotificationMessage('info', endUserMessages.DOWNLOAD_START);

    const response = await fetchAPI(downloadUrl);
    if (!response.ok) throw new Error(response.statusText);

    const blob = await response.blob();
    const file = new Blob([blob]);

    saveAs(file, filename);

    dispatch({
      type: EXPERIMENTS_DATA_DOWNLOAD_STARTED,
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

    console.log(e);

    pushNotificationMessage('error', endUserMessages.ERROR_DOWNLOADING_DATA);
  }
};

export default downloadExperimentData;
