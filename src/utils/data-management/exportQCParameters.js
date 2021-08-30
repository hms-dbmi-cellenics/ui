import _ from 'lodash';
import * as INI from 'ini';
import { qcSteps } from '../qcSteps';

const exportQCParameters = (config) => {
  const sortedConfig = qcSteps.map((s, i) => [`${i + 1}-${s}`, config[s] ?? {}]).sort();
  const string = INI.stringify(Object.fromEntries(sortedConfig), { whitespace: true });
  return new Blob([string], { type: 'text/plain;charset=utf-8' });
};

const filterQCParameters = (config, projectSamples,
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
  if (_.has(stepConfig, 'methodSettings')) {
    return {
      method: stepConfig.method,
      ...stepConfig.methodSettings[stepConfig.method],
    };
  }
  if (_.has(stepConfig, 'regressionTypeSettings')) {
    // numGenesVsNumUmis
    return {
      regressionType: stepConfig.regressionType,
      ...stepConfig.regressionTypeSettings[stepConfig.regressionType],
    };
  }
  return stepConfig;
};

export {
  exportQCParameters,
  filterQCParameters,
};
