/**
 * Composes the tree from the Redux store. Combines `hierarchy` with
 * `properties` to create a tree we can render.
 */
const composeTree = (hierarchy, properties) => {
  const composeTreeRecursive = (data) => data && data.map((node) => ({
    ...node,
    ...properties[node.key],
    children: node.children ? composeTreeRecursive(node.children) : undefined,
  }));

  return composeTreeRecursive(hierarchy);
};

export default composeTree;
