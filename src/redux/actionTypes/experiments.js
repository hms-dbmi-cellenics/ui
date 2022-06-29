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
 * Create experiments
 */
const EXPERIMENTS_LOADED = `${EXPERIMENTS}/loaded`;

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

/**
 * Update experiments
 */
const EXPERIMENTS_ERROR = `${EXPERIMENTS}/error`;

const EXPERIMENTS_SWITCH = `${EXPERIMENTS}/switch`;

/**
 * Set active project.
 */
const PROJECTS_SET_ACTIVE = `${EXPERIMENTS}/setActive`;

/**
 * Add project metadata.
 */
const PROJECTS_METADATA_CREATE = `${EXPERIMENTS}/metadataCreate`;

/**
 * Update project metadata.
 */
const PROJECTS_METADATA_UPDATE = `${EXPERIMENTS}/metadataUpdate`;

/**
 * Delete project metadta.
 */
const PROJECTS_METADATA_DELETE = `${EXPERIMENTS}/metadataDelete`;

export {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_DELETED,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SWITCH,
  PROJECTS_SET_ACTIVE,
  PROJECTS_METADATA_CREATE,
  PROJECTS_METADATA_UPDATE,
  PROJECTS_METADATA_DELETE,
};
