/**
 * Composes the tree from the Redux store. Combines `hierarchy` with
 * `properties` to create a tree we can render.
 *
 * `type` is the type of cell set we want to get. the default is `null`, which retrieves
 * all cell sets, including metadata.
 *
 */
const composeTree = (hierarchy, properties, filterType = null) => {
  const composeTreeRecursive = (data, type) => {
    if (!data) {
      return;
    }
    return data.filter(
      (root) => (!type || properties[root.key].type === type),
    ).map(
      (node) => ({
        ...node,
        ...properties[node.key],
        cellIds: [...properties[node.key]?.cellIds || []],
        children: node.children ? composeTreeRecursive(node.children, null) : undefined,
      }),
    );
  };
  return composeTreeRecursive(hierarchy, filterType);
};

/**
 * Reorders tree to conform to a specific ordering.
 *
 * `order` is a list containing the property keys that we want to reorder.
 *
 */
const setHierarchyOrder = (inputHierarchy, order = null) => {
  if (!order) {
    return inputHierarchy;
  }

  return inputHierarchy
    .filter((root) => root.children !== undefined)
    .map((root) => {
      if (
        root.children.length > 0
            && order[root.key].includes(root.children[0].key)) {
        return {
          key: root.key,
          children: order[root.key].map((sampleId) => ({ key: sampleId })),
        };
      }
      return root;
    });
};

export default composeTree;
export { setHierarchyOrder };
