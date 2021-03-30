import {
  PROJECTS_DELETE, PROJECTS_SET_ACTIVE,
} from '../../actionTypes/projects';

import {
  SAMPLES_DELETE,
} from '../../actionTypes/samples';

const deleteProject = (
  projectUuid,
) => async (dispatch, getState) => {
  // Delete samples
  const { projects } = getState();
  const { activeProject } = projects.meta;
  const { samples } = projects[projectUuid];

  if (samples.length) {
    samples.forEach((sampleUuid) => {
      dispatch({
        type: SAMPLES_DELETE,
        payload: {
          sampleUuid,
        },
      });
    });
  }

  dispatch({
    type: PROJECTS_DELETE,
    payload: { projectUuid },
  });

  // If deleted project is the same as the active project, choose another project
  if (projectUuid === activeProject) {
    dispatch({
      type: PROJECTS_SET_ACTIVE,
      payload: { projectUuid: projects.ids[0] || null },
    });
  }
};

export default deleteProject;
