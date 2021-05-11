import {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_DELETE,
  PROJECTS_METADATA_CREATE,
  PROJECTS_METADATA_UPDATE,
  PROJECTS_METADATA_DELETE,
} from '../../actionTypes/projects';
import initialState from './initialState';
import projectsCreate from './projectsCreate';
import projectsUpdate from './projectsUpdate';
import projectsDelete from './projectsDelete';
import projectsSetActive from './projectsSetActive';
import projectsMetadataCreate from './projectsMetadataCreate';
import projectsMetadataUpdate from './projectsMetadataUpdate';
import projectsMetadataDelete from './projectsMetadataDelete';

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

    case PROJECTS_METADATA_CREATE: {
      return projectsMetadataCreate(state, action);
    }

    case PROJECTS_METADATA_UPDATE: {
      return projectsMetadataUpdate(state, action);
    }

    case PROJECTS_METADATA_DELETE: {
      return projectsMetadataDelete(state, action);
    }

    default: {
      return state;
    }
  }
};

export default projectsReducer;
