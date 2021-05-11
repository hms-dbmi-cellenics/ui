import {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_DELETE,
  PROJECTS_SAVING,
  PROJECTS_SAVED,
  PROJECTS_ERROR,
  PROJECTS_RESTORE,
} from '../../actionTypes/projects';
import initialState from './initialState';
import projectsCreate from './projectsCreate';
import projectsUpdate from './projectsUpdate';
import projectsDelete from './projectsDelete';
import projectsSetActive from './projectsSetActive';
import projectsSaving from './projectsSaving';
import projectsSaved from './projectsSaved';
import projectsError from './projectsError';
import projectsRestore from './projectsRestore';

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
      return projectsSaved(state, action);
    }

    case PROJECTS_ERROR: {
      return projectsError(state, action);
    }

    case PROJECTS_RESTORE: {
      return projectsRestore(state, action);
    }

    default: {
      return state;
    }
  }
};

export default projectsReducer;
