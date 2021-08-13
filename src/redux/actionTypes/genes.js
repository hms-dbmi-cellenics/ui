const GENES = 'genes';

/**
 * Turns on the loading condition for gene information.
 * Components that have the particular properties requested in their dependencies
 * should set a loading state at this event.
 */
const GENES_PROPERTIES_LOADING = `${GENES}/propertiesLoading`;

/**
 * Sets the state of the gene data to be successfully loaded, with the appropriate gene data.
 * This is meant to be used for paginated data, where the data is
 * lazy-loaded by an API call or equivalent.
 */
const GENES_PROPERTIES_LOADED_PAGINATED = `${GENES}/propertiesLoadedPaginated`;

/**
 * Sets an error condition for gene properties data.
 */
const GENES_PROPERTIES_ERROR = `${GENES}/propertiesError`;

/**
 * Updates the list of selected genes with a new selected gene.
 */
const GENES_SELECT = `${GENES}/select`;

/**
 * Removes a deselected gene from the list of selected genes.
 */
const GENES_DESELECT = `${GENES}/deselect`;

/**
 * Turns on the loading state for expression data.
 */
const GENES_EXPRESSION_LOADING = `${GENES}/expressionLoading`;

/**
 * Sets the state of the expression store to be successfully loaded,
 * with the appropriate expression data.
 */
const GENES_EXPRESSION_LOADED = `${GENES}/expressionLoaded`;

/**
 * Sets an error condition for gene expression data.
 */
const GENES_EXPRESSION_ERROR = `${GENES}/expressionError`;

/**
 * Sets marker genes as loading
 */
const MARKER_GENES_LOADING = `${GENES}/markerGenesLoading`;

/**
 * Marker genes have finished loading
 */
const MARKER_GENES_LOADED = `${GENES}/markerGenesLoaded`;

/**
 * Marker genes load task had some kind of error
 */
const MARKER_GENES_ERROR = `${GENES}/markerGenesError`;

export {
  GENES_PROPERTIES_LOADING, GENES_PROPERTIES_LOADED_PAGINATED, GENES_PROPERTIES_ERROR,
  GENES_SELECT, GENES_DESELECT,
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR,
  MARKER_GENES_LOADING, MARKER_GENES_LOADED, MARKER_GENES_ERROR,
};
