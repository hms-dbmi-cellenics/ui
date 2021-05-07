import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import saveProject from './saveProject';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';

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
    // This is only for one sample per experiment
    // Should be changed when we support multiple samples per project
    experiments: [newExperimentId],
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
