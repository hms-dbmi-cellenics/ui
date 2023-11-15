/**
 * Composes the tree from the Redux store. Combines `hierarchy` with
 * `properties` to create a tree we can render.
 *
 * `type` is the type of cell set we want to get. the default is `null`, which retrieves
 * all cell sets, including metadata.
 *
 */
const composeTree = (hierarchy, properties, filterTypes = null) => {
  const composeTreeRecursive = (data, types) => {
    if (!data) {
      return;
    }
    return data.filter(
      (root) => (!types || types.includes(properties[root.key].type)),
    ).map(
      (node) => {
        // eslint-disable-next-line no-unused-vars
        const { parentNodeKey, ...restOfProperties } = properties[node.key];

        return ({
          ...node,
          ...restOfProperties,
          cellIds: [...properties[node.key]?.cellIds || []],
          children: node.children ? composeTreeRecursive(node.children, null) : undefined,
        });
      },
    );
  };
  return composeTreeRecursive(hierarchy, filterTypes);
};

export default composeTree;
