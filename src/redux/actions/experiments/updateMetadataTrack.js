import _ from 'lodash';

import { PROJECTS_METADATA_UPDATE } from 'redux/actionTypes/experiments';
import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';

const updateMetadataTrack = (
  oldName, newName, experimentId,
) => async (dispatch, getState) => {
  const { samples } = getState();
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
      type: PROJECTS_METADATA_UPDATE,
      payload: {
        oldKey: oldMetadataKey,
        newKey: newMetadataKey,
        projectUuid: experimentId,
      },
    });

    experiment.sampleIds.forEach((sampleUuid) => {
      dispatch({
        type: SAMPLES_UPDATE,
        payload: {
          sampleUuid,
          sample: { metadata: { [newMetadataKey]: samples[sampleUuid].metadata[oldMetadataKey] } },
        },
      });

      dispatch({
        type: SAMPLES_METADATA_DELETE,
        payload: {
          metadataKey: oldMetadataKey,
          sampleUuid,
        },
      });
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateMetadataTrack;
