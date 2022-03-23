import _ from 'lodash';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import {
  PROJECTS_METADATA_DELETE,
} from '../../actionTypes/projects';

import {
  SAMPLES_METADATA_DELETE,
} from '../../actionTypes/samples';
import saveSamples from '../samples/saveSamples';
import saveProject from './saveProject';

const deleteMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const { samples } = getState();
  const project = getState().projects[projectUuid];

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys = project.metadataKeys.filter((key) => key !== metadataKey);

  const newSamples = project.samples.reduce((curr, sampleUuid) => {
    const updatedSample = _.cloneDeep(samples[sampleUuid]);
    delete updatedSample.metadata[metadataKey];

    return {
      ...curr,
      [sampleUuid]: updatedSample,
    };
  }, {});

  try {
    const notifyUser = false;
    await dispatch(saveProject(projectUuid, newProject, false, notifyUser));
    await dispatch(saveSamples(projectUuid, newSamples, false, false, notifyUser));

    dispatch({
      type: PROJECTS_METADATA_DELETE,
      payload: {
        key: metadataKey,
        projectUuid,
      },
    });

    project.samples.forEach((sampleUuid) => dispatch({
      type: SAMPLES_METADATA_DELETE,
      payload: {
        sampleUuid,
        metadataKey,
      },
    }));
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default deleteMetadataTrack;
