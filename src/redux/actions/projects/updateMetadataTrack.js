import _ from 'lodash';

import {
  PROJECTS_METADATA_UPDATE,
} from 'redux/actionTypes/projects';
import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from 'redux/actionTypes/samples';
import saveSamples from 'redux/actions/samples/saveSamples';
import saveProject from 'redux/actions/projects/saveProject';

import fetchAPI from 'utils/http/fetchAPI';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';

import config from 'config';
import { api } from 'utils/constants';

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

  const newSamples = project.samples.reduce((curr, sampleUuid) => {
    const updatedSample = _.cloneDeep(samples[sampleUuid]);
    updatedSample.metadata[newMetadataKey] = samples[sampleUuid].metadata[oldMetadataKey];
    delete updatedSample.metadata[oldMetadataKey];

    return {
      ...curr,
      [sampleUuid]: updatedSample,
    };
  }, {});

  try {
    if (config.currentApiVersion === api.V1) {
      const notifyUser = false;
      await dispatch(saveProject(projectUuid, newProject, false, notifyUser));
      await dispatch(saveSamples(projectUuid, newSamples, false, false, notifyUser));
    } else if (config.currentApiVersion === api.V2) {
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
    }

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
