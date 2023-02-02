import _ from 'lodash';

import { EXPERIMENTS_METADATA_RENAME } from 'redux/actionTypes/experiments';

import fetchAPI from 'utils/http/fetchAPI';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { loadBackendStatus } from '../backendStatus';

const renameMetadataTrack = (
  oldName, newName, experimentId,
) => async (dispatch, getState) => {
  const experiment = getState().experiments[experimentId];

  const oldMetadataKey = metadataNameToKey(oldName);
  const newMetadataKey = metadataNameToKey(newName);

  const newExperiment = _.cloneDeep(experiment);
  newExperiment.metadataKeys = newExperiment.metadataKeys
    .filter((key) => key !== oldMetadataKey);

  newExperiment.metadataKeys.push(newMetadataKey);

  try {
    const body = { key: newMetadataKey };

    await fetchAPI(
      `/v2/experiments/${experimentId}/metadataTracks/${oldMetadataKey}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    dispatch({
      type: EXPERIMENTS_METADATA_RENAME,
      payload: {
        oldKey: oldMetadataKey,
        newKey: newMetadataKey,
        experimentId,
      },
    });

    await dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default renameMetadataTrack;
