import _ from 'lodash';
import {
  SAMPLES_DELETE,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

const deleteSamples = (
  sampleUuids,
) => async (dispatch, getState) => {
  const { samples, projects } = getState();

  if (!_.isArray(sampleUuids)) {
    // eslint-disable-next-line no-param-reassign
    sampleUuids = [sampleUuids];
  }

  const projectSamples = sampleUuids.reduce((acc, sampleUuid) => {
    if (!_.has(acc, samples[sampleUuid].projectUuid)) {
      acc[samples[sampleUuid].projectUuid] = [];
    }

    return {
      ...acc,
      [samples[sampleUuid].projectUuid]: [
        ...acc[samples[sampleUuid].projectUuid],
        sampleUuid,
      ],
    };
  }, {});

  Object.entries(projectSamples).forEach(([projectUuid, samplesToDelete]) => {
    dispatch({
      type: SAMPLES_DELETE,
      payload: { sampleUuids: samplesToDelete },
    });

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project: {
          samples: _.difference(projects[projectUuid].samples, samplesToDelete),
        },
      },
    });
  });
};

export default deleteSamples;
