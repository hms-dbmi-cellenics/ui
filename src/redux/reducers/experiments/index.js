import initialState from 'redux/reducers/experiments/initialState';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_EXAMPLES_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_DELETED,
  EXPERIMENTS_METADATA_CREATE,
  EXPERIMENTS_METADATA_DELETE,
  EXPERIMENTS_METADATA_RENAME,
  EXPERIMENTS_SET_ACTIVE,
} from 'redux/actionTypes/experiments';

import { SAMPLES_CREATED, SAMPLES_DELETE } from 'redux/actionTypes/samples';

import { EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED } from 'redux/actionTypes/experimentSettings';
import experimentsCreate from './experimentsCreate';
import experimentsUpdate from './experimentsUpdate';
import experimentsDelete from './experimentsDelete';
import experimentsSetActive from './experimentsSetActive';
import experimentsLoading from './experimentsLoading';
import experimentsLoaded from './experimentsLoaded';
import experimentsExamplesLoaded from './experimentsExamplesLoaded';
import experimentsError from './experimentsError';
import experimentsSaving from './experimentsSaving';
import experimentsMetadataCreate from './experimentsMetadataCreate';
import experimentsMetadataRename from './experimentsMetadataRename';
import experimentsMetadataDelete from './experimentsMetadataDelete';
import experimentsSaved from './experimentsSaved';

import samplesDelete from './samplesDelete';
import samplesCreated from './samplesCreated';

import pipelineVersionUpdated from './pipelineVersionUpdated';

const experimentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATED: {
      return experimentsCreate(state, action);
    }

    case EXPERIMENTS_UPDATED: {
      return experimentsUpdate(state, action);
    }

    case EXPERIMENTS_DELETED: {
      return experimentsDelete(state, action);
    }

    case EXPERIMENTS_SET_ACTIVE: {
      return experimentsSetActive(state, action);
    }

    case EXPERIMENTS_LOADING: {
      return experimentsLoading(state, action);
    }

    case EXPERIMENTS_LOADED: {
      return experimentsLoaded(state, action);
    }

    case EXPERIMENTS_EXAMPLES_LOADED: {
      return experimentsExamplesLoaded(state, action);
    }

    case EXPERIMENTS_ERROR: {
      return experimentsError(state, action);
    }

    case EXPERIMENTS_SAVING: {
      return experimentsSaving(state, action);
    }

    case EXPERIMENTS_SAVED: {
      return experimentsSaved(state, action);
    }

    case SAMPLES_CREATED: {
      return samplesCreated(state, action);
    }

    case SAMPLES_DELETE: {
      return samplesDelete(state, action);
    }

    case EXPERIMENTS_METADATA_CREATE: {
      return experimentsMetadataCreate(state, action);
    }

    case EXPERIMENTS_METADATA_RENAME: {
      return experimentsMetadataRename(state, action);
    }

    case EXPERIMENTS_METADATA_DELETE: {
      return experimentsMetadataDelete(state, action);
    }

    case EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED: {
      return pipelineVersionUpdated(state, action);
    }

    default: {
      return state;
    }
  }
};

export default experimentsReducer;
