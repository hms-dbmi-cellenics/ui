import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import saveProject from './saveProject';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';
import createExperiment from '../experiments/createExperiment';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const createProject = (
  projectName,
  projectDescription,
  newExperimentName,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newProjectUuid = uuidv4();

  // Always create an experiment for a new project
  // required because samples DynamoDB require experimentId
  const newExperiment = await dispatch(createExperiment(newProjectUuid, newExperimentName));

  const newProject = {
    ...projectTemplate,
    name: projectName,
    description: projectDescription,
    uuid: newProjectUuid,
    experiments: [newExperiment.id],
    createdDate: createdAt,
    lastModified: createdAt,
  };

  try {
    dispatch(saveProject(newProjectUuid, newProject));

    dispatch({
      type: PROJECTS_CREATE,
      payload: { project: newProject },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);
  }
};

export default createProject;
