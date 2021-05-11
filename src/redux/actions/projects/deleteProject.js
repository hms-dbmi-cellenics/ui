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
  const { activeProjectUuid } = projects.meta;

  dispatch({
    type: SAMPLES_DELETE,
    payload: {
      sampleUuids: projects[projectUuid].samples,
    },
  });

  dispatch({
    type: PROJECTS_DELETE,
    payload: { projectUuid },
  });

  // If deleted project is the same as the active project, choose another project
  if (projectUuid === activeProjectUuid) {
    dispatch({
      type: PROJECTS_SET_ACTIVE,
      payload: { projectUuid: projects.ids.length > 1 ? projects.ids[0] : null },
    });
  }
};

export default deleteProject;
