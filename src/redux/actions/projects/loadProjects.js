import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import endUserMessages from '../../../utils/endUserMessages';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from '../../actionTypes/projects';
import loadSamples from '../samples/loadSamples';

const loadProjects = () => async (dispatch) => {
  const url = '/v1/projects';
  try {
    dispatch({
      type: PROJECTS_LOADING,
    });
    const response = await fetchAPI(url);

    let data = await response.json();
    throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_PROJECTS);

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
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: message,
      },
    });
    pushNotificationMessage('error', message);
  }
};
export default loadProjects;
