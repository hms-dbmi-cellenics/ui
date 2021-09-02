import {
  TRAJECTORY_ANALYSIS_LOADING,
  TRAJECTORY_ANALYSIS_LOADED,
  TRAJECTORY_ANALYSIS_ERROR,
} from '../../actionTypes/trajectoryAnalysis';

import trajectoryAnalysisLoading from './trajectoryAnalysisLoading';
import trajectoryAnalysisLoaded from './trajectoryAnalysisLoaded';
import trajectoryAnalysisError from './trajectoryAnalysisError';

import initialState from './initialState';

const networkResourcesReducer = (state = initialState, action) => {
  switch (action.type) {
    case TRAJECTORY_ANALYSIS_LOADING: {
      return trajectoryAnalysisLoading(state, action);
    }

    case TRAJECTORY_ANALYSIS_LOADED: {
      return trajectoryAnalysisLoaded(state, action);
    }

    case TRAJECTORY_ANALYSIS_ERROR: {
      return trajectoryAnalysisError(state, action);
    }

    default: {
      return state;
    }
  }
};

export default networkResourcesReducer;
