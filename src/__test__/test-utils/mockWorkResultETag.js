const mockWorkResultETag = (
  objectHash,
  workRequestETagGenerator,
  geneExpressionETagGenerator,
) => ({
  ...objectHash,
  MD5: (ETagParams) => {
    if ('body' in ETagParams) {
      return workRequestETagGenerator(ETagParams);
    }

    if ('missingGenesBody' in ETagParams) {
      return geneExpressionETagGenerator(ETagParams);
    }
  },
});

export default mockWorkResultETag;
