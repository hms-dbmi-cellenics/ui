import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwWithEndUserMessage } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  PROJECTS_DELETE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from '../../actionTypes/projects';

import {
  SAMPLES_DELETE,
} from '../../actionTypes/samples';

import {
  EXPERIMENTS_DELETED,
} from '../../actionTypes/experiments';

const deleteProject = (
  projectUuid,
) => async (dispatch, getState) => {
  // Delete samples
  const { projects } = getState();
  const { activeProjectUuid } = projects.meta;

  dispatch({
    type: PROJECTS_SAVING,
    payload: {
      message: endUserMessages.deletingProject,
    },
  });

  const url = `/v1/projects/${projectUuid}`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const json = await response.json();
    throwWithEndUserMessage(response, json, endUserMessages.errorSaving);

    dispatch({
      type: EXPERIMENTS_DELETED,
      payload: {
        experimentIds: projects[projectUuid].experiments,
      },
    });

    dispatch({
      type: SAMPLES_DELETE,
      payload: {
        sampleUuids: projects[projectUuid].samples,
      },
    });

    dispatch({
      type: PROJECTS_DELETE,
      payload: { projectUuid },
    });

    dispatch({
      type: PROJECTS_SAVED,
    });

    // If deleted project is the same as the active project, choose another project
    if (projectUuid === activeProjectUuid) {
      dispatch({
        type: PROJECTS_SET_ACTIVE,
        payload: { projectUuid: projects.ids.length > 1 ? projects.ids[0] : null },
      });
    }
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    pushNotificationMessage('error', endUserMessages.errorDeletingProject);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: endUserMessages.errorDeletingProject,
      },
    });
  }
};

export default deleteProject;
