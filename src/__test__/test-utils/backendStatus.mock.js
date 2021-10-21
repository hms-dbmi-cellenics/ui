const backendStatus = {
  gem2: {
    executionArn: '"arn:aws:states:eu-east-1:000000000000:execution:biomage-gem2s-test-test9cd23b9138d3d5b6141835c85101495a92cd:fb047b29-a9fb-4e36-a0fc-b792e243test"',
    paramsHash: '67515f56ad338b8c7339593582614ff62e376587', // pragma: allowlist secret
    stateMachineArn: 'arn:aws:states:eu-east-1:000000000000:stateMachine:biomage-gem2s-test-test9cd23b9138d3d5b6141835c85101495atest',
  },
  pipeline: {
    executionArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-qc-test-test9cd23b9138d3d5b6141835c85101495a92cd:aef9d56d-a20c-4c10-ac1b-2c37cb87test',
    stateMachineArn: 'arn:aws:states:eu-west-1:000000000000:execution:biomage-qc-test-test9cd23b9138d3d5b6141835c85101495a92cd:aef9d56d-a20c-4c10-ac1b-2c37cb87test',
    completedSteps: [
      'ClassifierFilter',
      'CellSizeDistributionFilter',
      'MitochondrialContentFilter',
      'NumGenesVsNumUmisFilter',
      'DoubletScoresFilter',
      'DataIntegration',
      'ConfigureEmbedding',
    ],
    startDate: '2021-08-16T12:10:32.320Z',
    stopDate: '2021-08-16T12:21:07.847Z',
    status: 'SUCCEEDED',
  },
  worker: {
    ready: true,
    restartCount: 0,
    started: true,
    status: 'Running',
  },
};

export default backendStatus;
