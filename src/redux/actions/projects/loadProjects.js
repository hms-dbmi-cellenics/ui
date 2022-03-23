import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from 'redux/actionTypes/projects';
import loadSamples from '../samples/loadSamples';

const loadProjects = () => async (dispatch) => {
  const url = '/v1/projects';

  dispatch({
    type: PROJECTS_LOADING,
  });

  try {
    let data = await fetchAPI(url);

    // filter out "projects" that are actually old experiments without a project
    data = data.filter((project) => project.name !== project.uuid);

    await Promise.all(data
      .filter((entry) => entry.samples.length)
      .map((entry) => dispatch(loadSamples(false, entry.uuid))));

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
