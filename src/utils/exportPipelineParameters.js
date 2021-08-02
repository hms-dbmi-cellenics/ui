import _ from 'lodash';
import * as INI from 'ini';

const exportPipelineParameters = (config) => {
  const string = INI.stringify(config, { whitespace: true });
  return new Blob([string], { type: 'text/plain;charset=utf-8' });
};

const filterPipelineParameters = (config, projectSamples,
  samplesStore) => {
  const filtered = _.mapValues(config, (step) => (
    !_.get(step, 'enabled', true)
      ? { disabled: true }
      : Object.fromEntries(
        projectSamples.map((sample) => [
          samplesStore[sample]?.name,
          flattenSampleStepConfig(
            step[sample]?.filterSettings
            ?? _.mapValues(step, flattenSampleStepConfig),
          ),
        ]),
      )
  ));

  // settings for these steps are the same for all samples, so we can remove
  // duplication
  [filtered.dataIntegration] = Object.values(filtered.dataIntegration);
  [filtered.configureEmbedding] = Object.values(filtered.configureEmbedding);

  return filtered;
};

const flattenSampleStepConfig = (stepConfig) => {
  // for steps with multiple methods to choose from, only include
  // configuration for the method that is actually selected
  if (_.has(stepConfig, 'method')) {
    return {
      method: stepConfig.method,
      ..._.get(stepConfig.methodSettings, stepConfig.method),
    };
  }
  if (_.has(stepConfig, 'regressionType')) {
    // numGenesVsNumUmis
    return {
      regressionType: stepConfig.regressionType,
      ..._.get(stepConfig.regressionTypeSettings, stepConfig.regressionType),
    };
  }
  return stepConfig;
};

export {
  exportPipelineParameters,
  filterPipelineParameters,
};
