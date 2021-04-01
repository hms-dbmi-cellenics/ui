const SAMPLES = 'samples';

/**
 * Save sample.
 */
const SAMPLES_CREATE = `${SAMPLES}/create`;

/**
 * Update sample.
 */
const SAMPLES_UPDATE = `${SAMPLES}/update`;

/**
 * Delete sample.
 */
const SAMPLES_DELETE = `${SAMPLES}/delete`;

/**
 * Update files in sample.
 */
const SAMPLES_FILE_UPDATE = `${SAMPLES}/file_update`;

/**
 * Load sample.
 */
const SAMPLES_LOADED = `${SAMPLES}/loaded`;

/**
 * Error loading/saving sample.
 */
const SAMPLES_ERROR = `${SAMPLES}/error`;

export {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_DELETE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_ERROR,
};
