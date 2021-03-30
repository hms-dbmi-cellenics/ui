import {
  PROJECTS_DELETE,
} from '../../actionTypes/projects';

import {
  SAMPLES_DELETE,
} from '../../actionTypes/samples';

const deleteProject = (
  projectUuid,
) => async (dispatch, getState) => {
  // Delete samples
  const { samples } = getState().projects[projectUuid];

  if (samples.length) {
    samples.forEeach((sampleUuid) => {
      dispatch({
        type: SAMPLES_DELETE,
        payload: {
          sampleUuid,
        },
      });
    });
  }

  // Delete project
  dispatch({
    type: PROJECTS_DELETE,
    payload: { projectUuid },
  });
};

export default deleteProject;
