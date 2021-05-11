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
 * Rollback project to a previous state
 */
const PROJECTS_RESTORE = `${PROJECTS}/restore`;

export {
  PROJECTS_CREATE,
  PROJECTS_UPDATE,
  PROJECTS_SET_ACTIVE,
  PROJECTS_DELETE,
  PROJECTS_ERROR,
  PROJECTS_SAVED,
  PROJECTS_SAVING,
  PROJECTS_RESTORE,
};
