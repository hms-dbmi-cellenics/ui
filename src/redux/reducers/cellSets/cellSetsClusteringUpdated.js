/* eslint-disable no-param-reassign */
import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsClusteringUpdated = (state, action) => {
  const { data } = action.payload;
  const { hierarchy, properties } = state;

  const updatedRootNodesKeys = data.map((rootNode) => rootNode.key);
  const updatedRootNodesHierarchy = createHierarchyFromTree(data);
  const updatedRootNodesProperties = createPropertiesFromTree(data);

  let newHierarchy = hierarchy.filter((rootNode) => !updatedRootNodesKeys.includes(rootNode.key));
  newHierarchy = updatedRootNodesHierarchy.concat(newHierarchy);

  const newProperties = {};

  newHierarchy.forEach((rootNode) => {
    newProperties[rootNode.key] = (
      updatedRootNodesProperties[rootNode.key]
      || properties[rootNode.key]
    );

    rootNode.children.forEach((childNode) => {
      newProperties[childNode.key] = (
        updatedRootNodesProperties[childNode.key]
        || properties[childNode.key]
      );
    });
  });

  return {
    ...state,
    loading: false,
    updatingClustering: false,
    hierarchy: newHierarchy,
    properties: newProperties,
  };
};

export default cellSetsClusteringUpdated;
