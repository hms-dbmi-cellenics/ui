/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Typography, Checkbox, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import updateSamplesOptions from 'redux/actions/experiments/updateSamplesOptions';

import { sampleTech } from 'utils/constants';

const { Text, Paragraph } = Typography;

const SamplesOptions = () => {
  const dispatch = useDispatch();

  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);

  // Before sample-specific options are supported, we assume that the tech and options values
  // of the first sample applies for all samples in the experiment
  const getExperimentWideValue = (experimentId) => {
    if (!experimentId) return {};

    const activeExperiment = useSelector((state) => state.experiments[experimentId]);
    const firstSampleId = activeExperiment?.sampleIds[0];
    const {
      type: selectedTech,
      options: sampleOptions,
    } = useSelector((state) => state.samples[firstSampleId] || {});

    return { selectedTech, sampleOptions };
  };

  const { selectedTech, sampleOptions } = getExperimentWideValue(activeExperimentId);

  const updateAllSamples = (diff) => {
    dispatch(
      updateSamplesOptions(
        activeExperimentId,
        diff,
      ),
    );
  };

  const renderRhapsodyOption = () => (
    <>
      <Paragraph>
        <Checkbox
          checked={sampleOptions?.includeAbSeq}
          onChange={(e) => updateAllSamples({ includeAbSeq: e.target.checked })}
        >
          Include AbSeq data
          {' '}
          <Tooltip
            overlayStyle={{ minWidth: '400px' }}
            title='AbSeq data is filtered out by default. Checking this box includes the AbSeq data. Support for AbSeq is currently for visualization purposes only, as experiment-wide normalization will be slightly skewed. In case there is AbSeq data in your experiment, we suggest you create two projects; one including AbSeq data and one without, and compare the results.'
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </Checkbox>
      </Paragraph>
    </>
  );

  const renderOptions = {
    [sampleTech.RHAPSODY]: renderRhapsodyOption,
  };

  return (
    renderOptions[selectedTech] ? (
      <>
        <Text strong>
          Options
        </Text>
        {renderOptions[selectedTech]() }
      </>
    ) : null
  );
};

export default SamplesOptions;
