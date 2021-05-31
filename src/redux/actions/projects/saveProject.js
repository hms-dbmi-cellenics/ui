/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from '../../actionTypes/projects';

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
    const response = await fetchAPI(
      `/v1/projects/${projectUuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      },
    );

    if (!response.ok) {
      throw new Error(await response.json().message);
    }

    if (notifySave) {
      dispatch({
        type: PROJECTS_SAVED,
      });
    }
  } catch (e) {
    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: e.message,
      },
    });
    pushNotificationMessage('error', `Error saving project: ${e.message}`);
    return Promise.reject(e.message);
  }
};

export default saveProject;
