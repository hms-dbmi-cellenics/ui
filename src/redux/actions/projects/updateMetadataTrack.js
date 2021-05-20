import _ from 'lodash';
import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_UPDATE,
} from '../../actionTypes/projects';

import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import saveSamples from '../samples/saveSamples';
import errorTypes from './errorTypes';
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
    const updatedSample = samples[sampleUuid];
    updatedSample.metadata[newMetadataKey] = samples[sampleUuid].metadata[oldMetadataKey];
    delete updatedSample.metadata[oldMetadataKey];

    return {
      ...curr,
      [sampleUuid]: updatedSample,
    };
  }, {
    ids: project.samples,
  });

  try {
    await dispatch(saveProject(projectUuid, newProject, false));
    await dispatch(saveSamples(projectUuid, newSamples));

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
    dispatch(pushNotificationMessage('error', errorTypes.SAVE_PROJECT));
  }
};

export default updateMetadataTrack;
