/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (notifySave) {
      dispatch({
        type: PROJECTS_SAVED,
      });
    }
  } catch (e) {
    console.log('in saveProject');
    console.log(e);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: e.message,
      },
    });

    dispatch(pushNotificationMessage('error', `Error saving project: ${e.message}`, 5));
    return Promise.reject(e.message);
  }
};

export default saveProject;
