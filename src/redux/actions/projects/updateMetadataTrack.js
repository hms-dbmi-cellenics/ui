import _ from 'lodash';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import {
  PROJECTS_METADATA_UPDATE,
} from '../../actionTypes/projects';

import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from '../../actionTypes/samples';
import saveSamples from '../samples/saveSamples';
import saveProject from './saveProject';

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
    const notifyUser = false;
    console.log('calling save project');
    await dispatch(saveProject(projectUuid, newProject, false, notifyUser));
    console.log('calling save samples');
    await dispatch(saveSamples(projectUuid, newSamples, false, false, notifyUser));
    console.log('call after save samples');

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
