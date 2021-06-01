import fetchAPI from '../../../utils/fetchAPI';
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

import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import errorTypes from './errorTypes';

const deleteProject = (
  projectUuid,
) => async (dispatch, getState) => {
  // Delete samples
  const { projects } = getState();
  const { activeProjectUuid } = projects.meta;

  dispatch({
    type: PROJECTS_SAVING,
    payload: {
      message: 'Deleting project...',
    },
  });

  try {
    const response = await fetchAPI(
      `/v1/projects/${projectUuid}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(response.json().message);
    }

    // If deleted project is the same as the active project, choose another project
    if (projectUuid === activeProjectUuid) {
      dispatch({
        type: PROJECTS_SET_ACTIVE,
        payload: { projectUuid: projects.ids.length > 1 ? projects.ids[0] : null },
      });
    }

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
  } catch (e) {
    pushNotificationMessage('error', errorTypes.PROJECTS_DELETE);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorTypes.PROJECTS_DELETE,
      },
    });
  }
};

export default deleteProject;
