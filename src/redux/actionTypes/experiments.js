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
 * Experiment saved
 */
const EXPERIMENTS_SAVED = `${EXPERIMENTS}/saved`;

/**
 * Update experiments
 */
const EXPERIMENTS_ERROR = `${EXPERIMENTS}/error`;

/**
 * Data download is requested
 */
const EXPERIMENTS_DATA_DOWNLOAD_REQUESTED = `${EXPERIMENTS}/downloadRequested`;

/**
 * Download link is ready
 */
const EXPERIMENTS_DATA_DOWNLOAD_READY = `${EXPERIMENTS}/downloadReady`;

/**
 * Download link is clicked
 */
const EXPERIMENTS_DATA_DOWNLOADED = `${EXPERIMENTS}/downloaded`;

/**
 * There is download error
 */
const EXPERIMENTS_DATA_DOWNLOAD_ERROR = `${EXPERIMENTS}/downloadError`;

export {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_DELETED,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_DATA_DOWNLOAD_REQUESTED,
  EXPERIMENTS_DATA_DOWNLOAD_READY,
  EXPERIMENTS_DATA_DOWNLOADED,
  EXPERIMENTS_DATA_DOWNLOAD_ERROR,
};
