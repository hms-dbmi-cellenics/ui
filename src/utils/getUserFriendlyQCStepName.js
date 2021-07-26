const getUserFriendlyQCStepName = (step) => {
  switch (step) {
    case 'classifier':
      return 'Classifier filter';
    case 'cellSizeDistribution':
      return 'Cell size distribution filter';
    case 'mitochondrialContent':
      return 'Mitochondrial content filter';
    case 'numGenesVsNumUmis':
      return 'Number of genes vs UMIs filter';
    case 'doubletScores':
      return 'Doublet filter';
    case 'dataIntegration':
      return 'Data integration';
    case 'configureEmbedding':
      return 'Configure embedding';
    default:
      throw new Error('Step does not exist');
  }
};

export default getUserFriendlyQCStepName;
