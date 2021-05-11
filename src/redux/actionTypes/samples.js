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
const SAMPLES_FILE_UPDATE = `${SAMPLES}/fileUpdate`;

/**
 * Load sample.
 */
const SAMPLES_LOADED = `${SAMPLES}/loaded`;

/**
 * Saving samples.
 */
const SAMPLES_SAVING = `${SAMPLES}/saving`;

/**
 * Samples saved successfully.
 */
const SAMPLES_SAVED = `${SAMPLES}/saved`;

/**
 * Error loading/saving sample.
 */
const SAMPLES_ERROR = `${SAMPLES}/error`;

/**
 * Error loading/saving sample.
 */
const SAMPLES_RESTORE = `${SAMPLES}/restore`;

/**
* Delete metada from sample.
 */
const SAMPLES_METADATA_DELETE = `${SAMPLES}/metadataDelete`;

export {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_DELETE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_SAVING,
  SAMPLES_ERROR,
  SAMPLES_SAVED,
  SAMPLES_RESTORE,
  SAMPLES_METADATA_DELETE,
};
