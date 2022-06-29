const PROJECTS = 'projects';

/**
 * Update project.
 */
const PROJECTS_UPDATE = `${PROJECTS}/update`;

/**
 * Set active project.
 */
const PROJECTS_SET_ACTIVE = `${PROJECTS}/setActive`;

/**
 * Saving project.
 */
const PROJECTS_SAVING = `${PROJECTS}/saving`;

/**
 * Project saved.
 */
const PROJECTS_SAVED = `${PROJECTS}/saved`;

/**
 * Error saving or updating project.
 */
const PROJECTS_ERROR = `${PROJECTS}/error`;

/**
 * Add project metadata.
 */
const PROJECTS_METADATA_CREATE = `${PROJECTS}/metadataCreate`;

/**
 * Update project metadata.
 */
const PROJECTS_METADATA_UPDATE = `${PROJECTS}/metadataUpdate`;

/**
 * Delete project metadta.
 */
const PROJECTS_METADATA_DELETE = `${PROJECTS}/metadataDelete`;

/**
 * Load the projects
 */
const PROJECTS_LOADED = `${PROJECTS}/loaded`;

const PROJECTS_LOADING = `${PROJECTS}/loading`;
export {
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_ERROR,
  PROJECTS_SAVED,
  PROJECTS_SAVING,
  PROJECTS_METADATA_CREATE,
  PROJECTS_METADATA_UPDATE,
  PROJECTS_METADATA_DELETE,
  PROJECTS_LOADED,
  PROJECTS_LOADING,
};
