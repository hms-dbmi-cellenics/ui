import _ from 'lodash';
import * as INI from 'ini';

const exportPipelineParameters = (config) => {
  const string = INI.stringify(config, { whitespace: true });
  return new Blob([string], { type: 'text/plain;charset=utf-8' });
};

const filterPipelineParameters = (config, projectSamples,
  samplesStore) => Object.fromEntries(Object.entries(config)
  .map(([step, stepConfig]) => [
    step,
    (
      !_.get(stepConfig, 'enabled', true)
        ? { disabled: true }
        : Object.fromEntries(
          projectSamples.map((sample) => [
              samplesStore[sample]?.name,
              flattenSampleStepConfig(
                stepConfig[sample]?.filterSettings
                ?? _.mapValues(stepConfig, flattenSampleStepConfig),
              ),
          ]),
        )
    ),
  ]));

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
