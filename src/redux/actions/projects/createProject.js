import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';

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
    experimentId: newExperimentId,
    createdDate: createdAt,
    lastModified: createdAt,
  };

  try {
    await fetchAPI(
      `/v1/projects/${newProjectUuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      },
    );

    dispatch({
      type: PROJECTS_CREATE,
      payload: { project: newProject },
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 5));
  }
};

export default createProject;
