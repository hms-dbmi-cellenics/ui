import fetchAPI from 'utils/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

import config from 'config';
import { api } from 'utils/constants';

import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from 'redux/actionTypes/projects';
import loadSamples from 'redux/actions/samples/loadSamples';

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

  let url;

  try {
    let data;

    if (config.currentApiVersion === api.V1) {
      url = '/v1/projects';
      const response = await fetchAPI(url);

      data = await response.json();

      throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_PROJECTS);

      // filter out "projects" that are actually old experiments without a project
      data = data.filter((project) => project.name !== project.uuid);

      await Promise.all(data
        .filter((entry) => entry.samples.length)
        .map((entry) => dispatch(loadSamples(false, entry.uuid))));
    } else if (config.currentApiVersion === api.V2) {
      url = '/v2/experiments';
      const response = await fetchAPI(url);

      data = await response.json();
      throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_PROJECTS);

      data = toApiV1(data);

      // This section commented out because we going to use it
      // when samples loading is implemented in api v2

      // await Promise.all(data
      //   .filter((entry) => entry.samples.length)
      //   .map((entry) => dispatch(loadSamples(false, entry.uuid))));
    }

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
