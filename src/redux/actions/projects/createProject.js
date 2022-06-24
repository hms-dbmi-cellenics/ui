import moment from 'moment';

import {
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

  const { id: experimentId } = await dispatch(createExperiment(newExperimentName));

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
    uuid: experimentId,
    experiments: [experimentId],
    createdDate,
    lastModified: createdDate,
  };

  dispatch({
    type: PROJECTS_CREATE,
    payload: { project: newProject },
  });
};

export default createProject;
