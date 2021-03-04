import moment from 'moment';
import hash from 'object-hash';

import {
  PROJECTS_CREATE,
} from '../../actionTypes/projects';
import { projectTemplate } from '../../reducers/projects/initialState';

const createProject = (
  projectName,
) => async (dispatch) => {
  const createdAt = moment().local().format('DD MMM YYYY, HH:mm:ss [GMT]Z');

  const newProject = {
    ...projectTemplate,
    name: projectName,
    uuid: hash(projectName + moment().format('DDMMYYY')).slice(0, 10),
    createdDate: createdAt,
    lastModified: createdAt,
  };

  dispatch({
    type: PROJECTS_CREATE,
    payload: { project: newProject },
  });
};

export default createProject;
