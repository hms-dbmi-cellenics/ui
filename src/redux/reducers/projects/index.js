import {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
} from '../../actionTypes/projects';
import initialState from './initialState';
import projectsCreate from './projectsCreate';
import projectsUpdate from './projectsUpdate';
import projectsSetActive from './projectsSetActive';

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

    default: {
      return state;
    }
  }
};

export default projectsReducer;
