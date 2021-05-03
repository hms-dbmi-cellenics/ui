import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_DELETE,
} from '../../actionTypes/projects';

const deleteMetadataTrack = (
  name, projectUuid,
) => async (dispatch) => {
  dispatch({
    type: PROJECTS_METADATA_DELETE,
    payload: {
      key: metadataNameToKey(name),
      projectUuid,
    },
  });
};

export default deleteMetadataTrack;
