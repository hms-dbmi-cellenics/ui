/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
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
) => async (dispatch, getState) => {
  const project = newProject ?? getState().projects[projectUuid];

  if (notifySave) {
    dispatch({
      type: PROJECTS_SAVING,
      payload: {
        message: endUserMessages.SAVING_PROJECT,
      },
    });
  }

  const url = `/v1/projects/${projectUuid}`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    if (notifySave) {
      dispatch({
        type: PROJECTS_SAVED,
      });
    }
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.ERROR_SAVING;
    }
    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: message,
      },
    });
    pushNotificationMessage('error', message);
    return Promise.reject(message);
  }
};

export default saveProject;
