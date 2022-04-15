import {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_DELETE,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
  PROJECTS_ERROR,
  PROJECTS_METADATA_CREATE,
  PROJECTS_METADATA_UPDATE,
  PROJECTS_METADATA_DELETE,
  PROJECTS_LOADED,
  PROJECTS_LOADING,
} from '../../actionTypes/projects';

import initialState from './initialState';
import projectsCreate from './projectsCreate';
import projectsUpdate from './projectsUpdate';
import projectsDelete from './projectsDelete';
import projectsSetActive from './projectsSetActive';
import projectsSaving from './projectsSaving';
import projectsSaved from './projectsSaved';
import projectsError from './projectsError';
import projectsMetadataCreate from './projectsMetadataCreate';
import projectsMetadataUpdate from './projectsMetadataUpdate';
import projectsMetadataDelete from './projectsMetadataDelete';
import projectsLoaded from './projectsLoaded';
import projectsLoading from './projectsLoading';

import {
  SAMPLES_CREATE, SAMPLES_DELETE_API_V2,
} from '../../actionTypes/samples';

import samplesCreate from './samplesCreate';
import samplesDelete from './samplesDelete';

const projectsReducer = (state = initialState, action) => {
  switch (action.type) {
    case PROJECTS_CREATE: {
      return projectsCreate(state, action);
    }

    case PROJECTS_UPDATE: {
      return projectsUpdate(state, action);
    }

    case PROJECTS_SET_ACTIVE: {
      return projectsSetActive(state, action);
    }

    case PROJECTS_DELETE: {
      return projectsDelete(state, action);
    }

    case PROJECTS_SAVING: {
      return projectsSaving(state, action);
    }

    case PROJECTS_SAVED: {
      return projectsSaved(state);
    }

    case PROJECTS_ERROR: {
      return projectsError(state, action);
    }

    case PROJECTS_METADATA_CREATE: {
      return projectsMetadataCreate(state, action);
    }

    case PROJECTS_METADATA_UPDATE: {
      return projectsMetadataUpdate(state, action);
    }

    case PROJECTS_METADATA_DELETE: {
      return projectsMetadataDelete(state, action);
    }

    case PROJECTS_LOADED: {
      return projectsLoaded(state, action);
    }

    case PROJECTS_LOADING: {
      return projectsLoading(state);
    }

    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_DELETE_API_V2: {
      return samplesDelete(state, action);
    }

    default: {
      return state;
    }
  }
};

export default projectsReducer;
