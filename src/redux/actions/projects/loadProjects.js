import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from 'redux/actionTypes/projects';

import config from 'config';
import { api } from 'utils/constants';

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
      data = await fetchAPI(url);

      // filter out "projects" that are actually old experiments without a project
      data = data.filter((project) => project.name !== project.uuid);

      await Promise.all(data
        .filter((entry) => entry.samples.length)
        .map((entry) => dispatch(loadSamples(null, entry.uuid))));
    } else if (config.currentApiVersion === api.V2) {
      url = '/v2/experiments';
      data = await fetchAPI(url);

      data = toApiV1(data);

      await Promise.all(data
        .filter((entry) => entry.samples.length)
        .map((entry) => dispatch(loadSamples(null, entry.uuid))));
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
