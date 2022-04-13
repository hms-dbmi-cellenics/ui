import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import config from 'config';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import { api } from 'utils/constants';

import {
  PROJECTS_ERROR,
  PROJECTS_CREATE,
  PROJECTS_SAVING,
} from 'redux/actionTypes/projects';

import { projectTemplate } from 'redux/reducers/projects/initialState';
import createExperiment from 'redux/actions/experiments/createExperiment';
import endUserMessages from 'utils/endUserMessages';

const createProject = (
  projectName,
  projectDescription,
  newExperimentName,
) => async (dispatch) => {
  const createdDate = moment().toISOString();

  const newProjectUuid = uuidv4();

  const newExperiment = await dispatch(createExperiment(newProjectUuid, newExperimentName));

  dispatch({
    type: PROJECTS_SAVING,
    payload: {
      message: endUserMessages.SAVING_PROJECT,
    },
  });

  const newProject = {
    ...projectTemplate,
    name: projectName,
    description: projectDescription,
    uuid: newProjectUuid,
    experiments: [newExperiment.id],
    createdDate,
    lastModified: createdDate,
  };

  if (config.currentApiVersion === api.V2) {
    // If using api v2, we can replace projectUuid with experimentId
    newProject.uuid = newExperiment.id;
  } else if (config.currentApiVersion === api.V1) {
    const url = `/v1/projects/${newProjectUuid}`;

    try {
      await fetchAPI(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProject),
        },
      );
    } catch (e) {
      const errorMessage = handleError(e, endUserMessages.ERROR_CREATING_PROJECT);
      dispatch({
        type: PROJECTS_ERROR,
        payload: {
          error: errorMessage,
        },
      });
      return;
    }
  }
  dispatch({
    type: PROJECTS_CREATE,
    payload: { project: newProject },
  });
};

export default createProject;
