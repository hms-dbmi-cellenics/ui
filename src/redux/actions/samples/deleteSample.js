import {
  SAMPLES_DELETE,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

const deleteSample = (
  sampleUuid,
) => async (dispatch, getState) => {
  const { projectUuid } = getState().samples[sampleUuid];
  const { samples } = getState().projects[projectUuid];

  dispatch({
    type: SAMPLES_DELETE,
    payload: { sampleUuid },
  });

  dispatch({
    type: PROJECTS_UPDATE,
    payload: {
      projectUuid,
      project: {
        samples: samples.filter((uuid) => uuid !== sampleUuid),
      },
    },
  });
};

export default deleteSample;
