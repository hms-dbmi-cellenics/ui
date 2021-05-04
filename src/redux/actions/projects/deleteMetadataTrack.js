import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_DELETE,
} from '../../actionTypes/projects';

import {
  SAMPLES_METADATA_DELETE,
} from '../../actionTypes/samples';

const deleteMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const { samples } = getState().projects[projectUuid];

  dispatch({
    type: PROJECTS_METADATA_DELETE,
    payload: {
      key: metadataNameToKey(name),
      projectUuid,
    },
  });

  samples.forEach((sampleUuid) => dispatch({
    type: SAMPLES_METADATA_DELETE,
    payload: {
      sampleUuid,
      metadataKey: metadataNameToKey(name),
    },
  }));
};

export default deleteMetadataTrack;
