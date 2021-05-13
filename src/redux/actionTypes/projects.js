const PROJECTS = 'projects';

/**
 * Create project.
 */
const PROJECTS_CREATE = `${PROJECTS}/create`;

/**
 * Update project.
 */
const PROJECTS_UPDATE = `${PROJECTS}/update`;

/**
 * Set active project.
 */
const PROJECTS_SET_ACTIVE = `${PROJECTS}/setActive`;

/**
 * Delete project.
 */
const PROJECTS_DELETE = `${PROJECTS}/delete`;

/**
 * Delete project.
 */
const PROJECTS_DELETING = `${PROJECTS}/deleting`;

/**
 * Delete project.
 */
const PROJECTS_DELETED = `${PROJECTS}/deleted`;

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

export {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_DELETE,
  PROJECTS_DELETING,
  PROJECTS_DELETED,
  PROJECTS_ERROR,
  PROJECTS_SAVED,
  PROJECTS_SAVING,
  PROJECTS_METADATA_CREATE,
  PROJECTS_METADATA_UPDATE,
  PROJECTS_METADATA_DELETE,
};
