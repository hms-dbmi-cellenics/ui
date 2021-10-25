/* eslint-disable import/prefer-default-export */
const mockETag = (
  workRequestETagGenerator,
  geneExpressionETagGenerator,
) => (ETagParams) => {
  if ('body' in ETagParams) {
    return workRequestETagGenerator(ETagParams);
  }

  if ('missingGenesBody' in ETagParams) {
    return geneExpressionETagGenerator(ETagParams);
  }
};

export { mockETag };
