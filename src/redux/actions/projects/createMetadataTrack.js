import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_CREATE,
} from '../../actionTypes/projects';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch) => {
  dispatch({
    type: PROJECTS_METADATA_CREATE,
    payload: {
      projectUuid,
      key: metadataNameToKey(name),
    },
  });
};

export default createMetadataTrack;
