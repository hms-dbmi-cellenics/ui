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

const saveProject = (projectUuid, newProject) => async (dispatch, getState) => {
  const project = newProject ?? getState().projects[projectUuid];

  dispatch({
    type: PROJECTS_SAVING,
  });

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

    dispatch({
      type: PROJECTS_SAVED,
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 5));

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorTypes.SAVE_PROJECT,
      },
    });
  }
};

export default saveProject;
