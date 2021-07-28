const createHierarchyFromTree = (data, order = null) => data && data.map((rootNode) => {
  const rootNodeObject = {
    key: rootNode.key,
  };

  if (rootNode.children) {
    const children = order && order[rootNode.key]
      ? order[rootNode.key].map((key) => ({ key })) : rootNode.children;
    rootNodeObject.children = children.map((child) => ({ key: child.key }));
  }

  return rootNodeObject;
});

const createPropertiesFromTree = (data) => {
  // Create object of properties.
  const properties = {};

  const traverseProperties = ((nodes) => {
    if (nodes) {
      nodes.forEach((node) => {
        const {
          key, name, color, cellIds, rootNode, type,
        } = node;

        properties[key] = {
          name,
          color,
          cellIds: new Set(cellIds),
          rootNode,
          type,
        };

        if (node.children) {
          traverseProperties(node.children);
        }
      });
    }
  });

  traverseProperties(data);

  return properties;
};

export { createHierarchyFromTree, createPropertiesFromTree };
