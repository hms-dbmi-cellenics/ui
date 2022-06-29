import _ from 'lodash';

import {
  PROJECTS_METADATA_UPDATE,
} from 'redux/actionTypes/projects';
import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';

const updateMetadataTrack = (
  oldName, newName, projectUuid,
) => async (dispatch, getState) => {
  const { samples } = getState();
  const project = getState().projects[projectUuid];

  const oldMetadataKey = metadataNameToKey(oldName);
  const newMetadataKey = metadataNameToKey(newName);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys = newProject.metadataKeys
    .filter((key) => key !== oldMetadataKey);

  newProject.metadataKeys.push(newMetadataKey);

  try {
    const body = { key: newMetadataKey };

    await fetchAPI(
      `/v2/experiments/${projectUuid}/metadataTracks/${oldMetadataKey}`,
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
        projectUuid,
      },
    });

    project.samples.forEach((sampleUuid) => {
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
