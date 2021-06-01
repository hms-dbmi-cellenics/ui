import _ from 'lodash';
import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_CREATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import endUserMessages from '../../../utils/endUserMessages';
import saveProject from './saveProject';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys.push(metadataKey);

  try {
    await dispatch(saveProject(projectUuid, newProject));

    dispatch({
      type: PROJECTS_METADATA_CREATE,
      payload: {
        projectUuid,
        key: metadataKey,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.errorSaving);
  }
};

export default createMetadataTrack;
