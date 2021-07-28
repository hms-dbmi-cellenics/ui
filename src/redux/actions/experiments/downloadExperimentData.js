import {
  EXPERIMENTS_DATA_DOWNLOAD_REQUESTED,
  EXPERIMENTS_DATA_DOWNLOAD_READY,
  EXPERIMENTS_DATA_DOWNLOAD_ERROR,
} from '../../actionTypes/experiments';

import downloadType from '../../../utils/downloadTypes';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const downloadExperimentData = (
  Storage,
  experimentId,
  type,
) => async (dispatch, getState) => {
  try {
    if (!Object.values(downloadType).includes(type)) throw new Error('Invalid download type');

    const downloadStatus = getState().experiments.meta.download[type] || {};
    const { environment } = getState().networkResources;

    const objectKey = `${experimentId}/r.rds`;

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

    const bucket = `processed-matrix-${environment}`;
    const downloadLink = await Storage.get(objectKey, { bucket, expired: 60 });

    dispatch({
      type: EXPERIMENTS_DATA_DOWNLOAD_READY,
      payload: {
        type,
      },
    });

    return downloadLink;
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

export default downloadExperimentData;
