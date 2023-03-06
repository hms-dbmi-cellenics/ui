const CELL_SETS = 'cellSets';

/**
 * Updates the cells sets shown to the user with the hierarchy fetched
 * from the API.
 */
const CELL_SETS_LOADED = `${CELL_SETS}/loaded`;

/**
 * Signals to the UI that new cell set data is about to be loaded in.
 */
const CELL_SETS_LOADING = `${CELL_SETS}/loading`;

/**
 * Creates a new cell set.
 */
const CELL_SETS_CREATE = `${CELL_SETS}/create`;

/**
 * Updates a single cell set's properties.
 */
const CELL_SETS_UPDATE_PROPERTY = `${CELL_SETS}/updateProperty`;

/**
 * Cell sets were reordered
 */
const CELL_SETS_REORDER = `${CELL_SETS}/reorder`;

/**
 * Updates the list of selected cell sets.
 */
const CELL_SETS_SET_SELECTED = `${CELL_SETS}/setSelected`;

/**
 * Deletes a cell set.
 */
const CELL_SETS_DELETE = `${CELL_SETS}/delete`;

/**
 * Deletes a cell class.
 */
const CELL_CLASS_DELETE = `${CELL_SETS}/deleteClass`;

/**
 * Saves all cell sets currently loaded.
 */
const CELL_SETS_SAVE = `${CELL_SETS}/save`;

/**
 * Hide a cell set from visualizations.
 */
const CELL_SETS_HIDE = `${CELL_SETS}/hide`;

/**
 * Unhide [remove a previous hidden state] from a cell set from visualizations.
 */
const CELL_SETS_UNHIDE = `${CELL_SETS}/unhide`;

/**
 * Unhide all hidden cell sets.
 */
const CELL_SETS_UNHIDE_ALL = `${CELL_SETS}/unhideAll`;

// /**
//  * Cell sets clustering being recalculated.
//  */
const CELL_SETS_CLUSTERING_UPDATING = `${CELL_SETS}/clusteringUpdating`;

// /**
//  * Cell sets clustering being recalculated.
//  */
const CELL_SETS_CLUSTERING_UPDATED = `${CELL_SETS}/clusteringUpdated`;

/**
 * Creates an error condition in the cell set tool.
 */
const CELL_SETS_ERROR = `${CELL_SETS}/error`;

export {
  CELL_SETS_LOADING, CELL_SETS_LOADED,
  CELL_SETS_CREATE,
  CELL_SETS_UPDATE_PROPERTY, CELL_SETS_REORDER, CELL_SETS_SET_SELECTED,
  CELL_SETS_DELETE,
  CELL_CLASS_DELETE,
  CELL_SETS_SAVE,
  CELL_SETS_HIDE, CELL_SETS_UNHIDE, CELL_SETS_UNHIDE_ALL,
  CELL_SETS_CLUSTERING_UPDATING, CELL_SETS_CLUSTERING_UPDATED,
  CELL_SETS_ERROR,
};
