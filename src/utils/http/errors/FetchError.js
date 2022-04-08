class FetchError extends Error {
  constructor(error) {
    super(error);

    this.name = 'Fetch Error';
    this.error = error;
  }
}
module.exports = FetchError;
