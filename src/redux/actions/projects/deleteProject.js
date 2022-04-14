import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  PROJECTS_DELETE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from '../../actionTypes/projects';

import {
  SAMPLES_DELETE_API_V1,
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
      message: endUserMessages.DELETING_PROJECT,
    },
  });

  const url = `/v1/projects/${projectUuid}`;
  try {
    await fetchAPI(
      url,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // If deleted project is the same as the active project, choose another project
    if (projectUuid === activeProjectUuid) {
      const leftoverProjectIds = projects.ids.filter((uuid) => uuid !== activeProjectUuid);

      dispatch({
        type: PROJECTS_SET_ACTIVE,
        payload: { projectUuid: leftoverProjectIds.length ? leftoverProjectIds[0] : null },
      });
    }

    dispatch({
      type: EXPERIMENTS_DELETED,
      payload: {
        experimentIds: projects[projectUuid].experiments,
      },
    });

    dispatch({
      type: SAMPLES_DELETE_API_V1,
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
    const errorMessage = handleError(e, endUserMessages.ERROR_DELETING_PROJECT);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default deleteProject;
