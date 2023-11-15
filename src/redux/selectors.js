/* eslint-disable import/prefer-default-export */

// Accumulates all the different selectors

import * as backendSelectors from './selectors/backendStatus';
import * as cellSetsSelectors from './selectors/cellSets';
import * as genesSelectors from './selectors/genes';
import * as componentConfigSelectors from './selectors/componentConfig';

const getBackendStatus = (...params) => (state) => (
  backendSelectors.getBackendStatus(...params)(state.backendStatus));

const getCellSets = (...params) => (state) => (
  cellSetsSelectors.getCellSets(...params)(state.cellSets));

const getCellSetsHierarchy = (...params) => (state) => (
  cellSetsSelectors.getCellSetsHierarchy(...params)(state.cellSets));

const getCellSetsHierarchyByType = (...params) => (state) => (
  cellSetsSelectors.getCellSetsHierarchyByType(...params)(state.cellSets));

const getCellSetsHierarchyByKeys = (...params) => (state) => (
  cellSetsSelectors.getCellSetsHierarchyByKeys(...params)(state.cellSets));

const getPlotConfigs = (...params) => (state) => (
  componentConfigSelectors.getPlotConfigs(...params)(state.componentConfig));

const getGeneList = (...params) => (state) => (
  genesSelectors.getGeneList(...params)(state.genes));

const getSelectedMetadataTracks = (...params) => (state) => (
  componentConfigSelectors.getSelectedMetadataTracks(...params)(state)
);

export {
  getBackendStatus,
  getCellSets,
  getCellSetsHierarchy,
  getCellSetsHierarchyByType,
  getCellSetsHierarchyByKeys,
  getPlotConfigs,
  getGeneList,
  getSelectedMetadataTracks,
};
