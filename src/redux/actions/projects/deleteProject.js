import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import {
  PROJECTS_DELETE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_ERROR,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
} from 'redux/actionTypes/projects';

import {
  EXPERIMENTS_DELETED,
} from 'redux/actionTypes/experiments';

import config from 'config';
import { api } from 'utils/constants';
import { SAMPLES_DELETE } from 'redux/actionTypes/samples';

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

  try {
    if (config.currentApiVersion === api.V1) {
      await fetchAPI(
        `/v1/projects/${projectUuid}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    } else if (config.currentApiVersion === api.V2) {
      await fetchAPI(
        `/v2/experiments/${projectUuid}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // If deleted project is the same as the active project, choose another project
    if (projectUuid === activeProjectUuid) {
      const leftoverProjectIds = projects.ids.filter((uuid) => uuid !== activeProjectUuid);

      dispatch({
        type: PROJECTS_SET_ACTIVE,
        payload: { projectUuid: leftoverProjectIds.length ? leftoverProjectIds[0] : null },
      });
    }

    dispatch({
      type: SAMPLES_DELETE,
      payload: {
        experimentId: projectUuid,
        sampleIds: projects[projectUuid].samples,
      },
    });

    dispatch({
      type: EXPERIMENTS_DELETED,
      payload: {
        experimentIds: projects[projectUuid].experiments,
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
