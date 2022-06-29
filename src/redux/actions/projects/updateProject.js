import moment from 'moment';
import _ from 'lodash';

import {
  PROJECTS_UPDATE,
} from 'redux/actionTypes/projects';

import endUserMessages from 'utils/endUserMessages';
import mergeObjectReplacingArrays from 'utils/mergeObjectReplacingArrays';
import handleError from 'utils/http/handleError';

const updateProject = (
  experimentId,
  diff,
) => async (dispatch, getState) => {
  const currentExperiment = _.cloneDeep(getState().experiments[experimentId]);

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newProject = mergeObjectReplacingArrays(currentExperiment, diff);

  try {
    // With api.V2 dont do any fetch
    // updating the project is all we need from this action creator

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid: experimentId,
        project: newProject,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default updateProject;
