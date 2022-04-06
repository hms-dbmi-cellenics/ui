import moment from 'moment';
import _ from 'lodash';

import config from 'config';
import { api } from 'utils/constants';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import endUserMessages from '../../../utils/endUserMessages';
import saveProject from './saveProject';

import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProject = (
  projectUuid,
  diff,
) => async (dispatch, getState) => {
  const currentProject = _.cloneDeep(getState().projects[projectUuid]);

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newProject = mergeObjectWithArrays(currentProject, diff);

  try {
    // if config.currentApiVersion === api.V2 dont do any fetch, updating the experiment is enough
    if (config.currentApiVersion === api.V1) {
      await dispatch(saveProject(projectUuid, newProject));
    }

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project: newProject,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateProject;
