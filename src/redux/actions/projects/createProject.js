import moment from 'moment';

import {
  PROJECTS_CREATE,
  PROJECTS_ERROR,
  PROJECTS_SAVING,
} from 'redux/actionTypes/projects';

import { projectTemplate } from 'redux/reducers/projects/initialState';
import createExperiment from 'redux/actions/experiments/createExperiment';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';

const createProject = (
  projectName,
  projectDescription,
  newExperimentName,
) => async (dispatch) => {
  const createdDate = moment().toISOString();

  try {
    dispatch({
      type: PROJECTS_SAVING,
      payload: {
        message: endUserMessages.SAVING_PROJECT,
      },
    });

    const { id: experimentId } = await dispatch(createExperiment(newExperimentName));

    const newProject = {
      ...projectTemplate,
      name: projectName,
      description: projectDescription,
      uuid: experimentId,
      experiments: [experimentId],
      createdDate,
      lastModified: createdDate,
    };

    dispatch({
      type: PROJECTS_CREATE,
      payload: { project: newProject },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_CREATING_PROJECT);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default createProject;
