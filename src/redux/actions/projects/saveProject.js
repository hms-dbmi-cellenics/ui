/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from '../../actionTypes/projects';

const saveProject = (
  projectUuid,
  newProject,
  notifySave = true,
  notifyUser = true,
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
    await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      },
      false,
    );

    if (notifySave) {
      dispatch({
        type: PROJECTS_SAVED,
      });
    }
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING, notifyUser);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    // TODO I think this will lead to duplicated error messages but it might be needed.
    // return Promise.reject(errorMessage);
    throw e;
    // throw new Error(errorMessage);
  }
};

export default saveProject;
