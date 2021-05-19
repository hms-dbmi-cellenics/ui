import _ from 'lodash';
import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_CREATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../pushNotificationMessage';
import errorTypes from './errorTypes';
import saveProject from './saveProject';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);

  newProject.metadataKeys.push(metadataKey);

  try {
    dispatch(saveProject(projectUuid, newProject, false));

    dispatch({
      type: PROJECTS_METADATA_CREATE,
      payload: {
        projectUuid,
        key: metadataKey,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);
  }
};

export default createMetadataTrack;
