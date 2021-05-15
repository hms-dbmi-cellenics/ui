import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import saveProject from './saveProject';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const createProject = (
  projectName, projectDescription,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newProjectUuid = uuidv4();
  const newExperimentId = uuidv4();

  const newProject = {
    ...projectTemplate,
    name: projectName,
    description: projectDescription,
    uuid: newProjectUuid,
    experiments: [newExperimentId],
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
