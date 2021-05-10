import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import saveProject from './saveProject';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';
import createExperiment from '../experiments/createExperiment';

const createProject = (
  projectName, projectDescription,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newProjectUuid = uuidv4();

  // Always create an experiment for a new project
  // required because samples DynamoDB require experimentId
  const newExperiment = await dispatch(createExperiment(newProjectUuid));

  const newProject = {
    ...projectTemplate,
    name: projectName,
    description: projectDescription,
    uuid: newProjectUuid,
    experiments: [newExperiment.id],
    createdDate: createdAt,
    lastModified: createdAt,
  };

  dispatch({
    type: PROJECTS_CREATE,
    payload: { project: newProject },
  });

  dispatch(saveProject(newProjectUuid));
};

export default createProject;
