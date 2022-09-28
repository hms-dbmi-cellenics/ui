class SampleValidationError extends Error {
  constructor(error) {
    super(error);

    this.name = 'SampleValidationError';
    this.error = error;
  }
}
module.exports = SampleValidationError;
