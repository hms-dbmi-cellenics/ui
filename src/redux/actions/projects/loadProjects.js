import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from 'redux/actionTypes/projects';

const toApiV1 = (experimentListV2) => {
  const projectsListV1 = experimentListV2.map((experimentData) => {
    const {
      createdAt,
      updatedAt,
      id,
      samplesOrder,
      ...restOfExperimentData
    } = experimentData;

    // Not assigning "lastAnalyzed" because that is no longer used anywhere
    const experimentDataV1 = {
      createdDate: createdAt,
      lastModified: updatedAt,
      experiments: [id],
      uuid: id,
      samples: samplesOrder,
      ...restOfExperimentData,
    };

    return experimentDataV1;
  });

  return projectsListV1;
};

const loadProjects = () => async (dispatch) => {
  dispatch({
    type: PROJECTS_LOADING,
  });

  try {
    let data = await fetchAPI('/v2/experiments');

    data = toApiV1(data);

    const ids = data.map((project) => project.uuid);

    dispatch({
      type: PROJECTS_LOADED,
      payload: {
        projects: data,
        ids,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_LOADING_PROJECT);

    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};
export default loadProjects;
