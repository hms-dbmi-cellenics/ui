import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import saveProject from './saveProject';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';
import createExperiment from '../experiments/createExperiment';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const createProject = (
  projectName,
  projectDescription,
  newExperimentName,
) => async (dispatch) => {
  const createdDate = moment().toISOString();

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
    createdDate,
    lastModified: createdDate,
  };

  try {
    await dispatch(saveProject(newProjectUuid, newProject));

    dispatch({
      type: PROJECTS_CREATE,
      payload: { project: newProject },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.errorSaving);
  }
};

export default createProject;
