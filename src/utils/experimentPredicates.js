const getIsUnisample = (hierarchy) => hierarchy.find((rootNode) => rootNode.key === 'sample')?.children?.length === 1;

// eslint-disable-next-line import/prefer-default-export
export { getIsUnisample };
