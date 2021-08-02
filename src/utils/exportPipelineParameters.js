import _ from 'lodash';

const filterPipelineParameters = (config, projectSamples,
  samplesStore) => Object.fromEntries(Object.entries(config)
  .map(([step, stepConfig]) => [
    step,
    (!_.get(stepConfig, 'enabled', true)
      ? { disabled: true }
      : Object.fromEntries(
        projectSamples.map((sample) => [
            samplesStore[sample]?.name,
            flattenSampleStepConfig(stepConfig[sample]?.filterSettings
            ?? _.mapValues(stepConfig, flattenSampleStepConfig)),
        ]),
      )),
  ]));

const flattenSampleStepConfig = (stepConfig) => {
  // for steps with multiple methods to choose from, only include
  // configuration for the method that is actually selected
  if (Object.prototype.hasOwnProperty.call(stepConfig, 'method')) {
    return {
      method: stepConfig.method,
      ..._.get(stepConfig.methodSettings, stepConfig.method),
    };
  }
  if (Object.prototype.hasOwnProperty.call(stepConfig, 'regressionType')) {
    // numGenesVsNumUmis
    return {
      regressionType: stepConfig.regressionType,
      ..._.get(stepConfig.regressionTypeSettings, stepConfig.regressionType),
    };
  }
  return stepConfig;
};

export default filterPipelineParameters;
