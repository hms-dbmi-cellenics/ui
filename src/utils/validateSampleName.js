const validateSampleName = (input, sampleNames) => (
  !sampleNames.has(input)
);

export default validateSampleName;
