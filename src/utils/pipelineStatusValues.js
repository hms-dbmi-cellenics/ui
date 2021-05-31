// Pipeline states as defined in
// https://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
// Additional statuses are defined in the API

export default {
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
  TIMED_OUT: 'TIMED_OUT',
  ABORTED: 'ABORTED',
  SUCCEEDED: 'SUCCEEDED',

  // Custom defined statuses defined in the API
  NOT_CREATED: 'NotCreated',
};
