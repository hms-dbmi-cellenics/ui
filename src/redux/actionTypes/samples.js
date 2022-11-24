const SAMPLES = 'samples';

/**
 * Samples created.
 */
const SAMPLES_CREATED = `${SAMPLES}/created`;

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
 * Bulk update sample options.
 */
const SAMPLES_OPTIONS_UPDATE = `${SAMPLES}/optionsUpdate`;

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
 * Delete metada from sample.
 */
const SAMPLES_METADATA_DELETE = `${SAMPLES}/metadataDelete`;

/**
 * Value in a metadata track was updated for a sample.
 */
const SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED = `${SAMPLES}/valueInMetadataTrackUpdated`;

const SAMPLES_LOADING = `${SAMPLES}/loading`;

const SAMPLES_VALIDATING_UPDATED = `${SAMPLES}/validatingUpdated`;

export {
  SAMPLES_CREATED,
  SAMPLES_UPDATE,
  SAMPLES_DELETE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_OPTIONS_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_SAVING,
  SAMPLES_ERROR,
  SAMPLES_SAVED,
  SAMPLES_METADATA_DELETE,
  SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
  SAMPLES_LOADING,
  SAMPLES_VALIDATING_UPDATED,
};
