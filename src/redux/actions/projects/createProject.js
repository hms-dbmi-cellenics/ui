import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';

const createProject = (
  projectName,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newProject = {
    ...projectTemplate,
    name: projectName,
    uuid: uuidv4(),
    createdDate: createdAt,
    lastModified: createdAt,
  };

  dispatch({
    type: PROJECTS_CREATE,
    payload: { project: newProject },
  });
};

export default createProject;
