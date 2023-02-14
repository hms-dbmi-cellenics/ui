const EXPERIMENTS = 'experiments';

/**
 * Create experiments
 */
const EXPERIMENTS_CREATED = `${EXPERIMENTS}/created`;

/**
 * Create experiments
 */
const EXPERIMENTS_LOADING = `${EXPERIMENTS}/loading`;

/**
 * Experiments loaded
 */
const EXPERIMENTS_LOADED = `${EXPERIMENTS}/loaded`;

/**
 * Example experiments loaded
 */
const EXPERIMENTS_EXAMPLES_LOADED = `${EXPERIMENTS}/examplesLoaded`;

/**
 * Experiments updated
 */
const EXPERIMENTS_UPDATED = `${EXPERIMENTS}/updated`;

/**
 * Delete experiments
 */
const EXPERIMENTS_DELETED = `${EXPERIMENTS}/deleted`;

/**
 * Saving experiment
 */
const EXPERIMENTS_SAVING = `${EXPERIMENTS}/saving`;

const EXPERIMENTS_SAVED = `${EXPERIMENTS}/saved`;

/**
 * Update experiments
 */
const EXPERIMENTS_ERROR = `${EXPERIMENTS}/error`;

const EXPERIMENTS_SWITCH = `${EXPERIMENTS}/switch`;

/**
 * Set active project.
 */
const EXPERIMENTS_SET_ACTIVE = `${EXPERIMENTS}/setActive`;

/**
 * Add project metadata.
 */
const EXPERIMENTS_METADATA_CREATE = `${EXPERIMENTS}/metadataCreate`;

/**
 * Update project metadata.
 */
const EXPERIMENTS_METADATA_RENAME = `${EXPERIMENTS}/metadataRename`;

/**
 * Delete project metadta.
 */
const EXPERIMENTS_METADATA_DELETE = `${EXPERIMENTS}/metadataDelete`;

export {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_EXAMPLES_LOADED,
  EXPERIMENTS_DELETED,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_SWITCH,
  EXPERIMENTS_SET_ACTIVE,
  EXPERIMENTS_METADATA_CREATE,
  EXPERIMENTS_METADATA_RENAME,
  EXPERIMENTS_METADATA_DELETE,
};
