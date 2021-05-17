/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import {
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from '../../actionTypes/projects';

import errorTypes from './errorTypes';

const saveProject = (
  projectUuid,
  newProject,
  notifySave = true,
  message = 'Saving project...',
) => async (dispatch, getState) => {
  const project = newProject ?? getState().projects[projectUuid];

  if (notifySave) {
    dispatch({
      type: PROJECTS_SAVING,
      payload: {
        message,
      },
    });
  }

  try {
    await fetchAPI(
      `/v1/projects/${projectUuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      },
    );

    if (notifySave) {
      dispatch({
        type: PROJECTS_SAVED,
      });
    }
  } catch (e) {
    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorTypes.SAVE_PROJECT,
      },
    });

    dispatch(pushNotificationMessage('error', messages.connectionError, 5));
  }
};

export default saveProject;
