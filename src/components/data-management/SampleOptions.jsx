/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Typography, Checkbox, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import bulkUpdateSampleOptions from 'redux/actions/samples/bulkUpdateSampleOptions';

import { technologies } from 'utils/upload/fileUploadSpecifications';

const { Text, Paragraph } = Typography;

const SampleOptions = () => {
  const dispatch = useDispatch();

  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

  const firstSampleId = activeExperiment?.sampleIds[0];
  const {
    type: selectedTech,
    options: sampleOptions,
  } = useSelector((state) => state.samples[firstSampleId] || {});

  const updateAllSamples = (diff) => {
    dispatch(
      bulkUpdateSampleOptions(
        activeExperimentId,
        activeExperiment.sampleIds,
        diff,
      ),
    );
  };

  const renderRhapsodyOption = () => (
    <>
      <Paragraph>
        <Checkbox
          checked={sampleOptions?.includeAbseq}
          onChange={(e) => updateAllSamples({ includeAbseq: e.target.checked })}
        >
          Include AbSeq data
          {' '}
          <Tooltip title='AbSeq data is filtered out by default. Checking this box includes the AbSeq data. Support for AbSeq is currently for visualization purposes only, as experiment-wide normalization will be slightly skewed. In case there is AbSeq data in your experiment, we suggest you create two projects; one including AbSeq data and one without, and compare the results.'>
            <QuestionCircleOutlined />
          </Tooltip>
        </Checkbox>
      </Paragraph>
    </>
  );

  const renderOptions = {
    [technologies.rhapsody]: renderRhapsodyOption,
  };

  if (!renderOptions[selectedTech]) return <></>;

  return (
    <>
      <Text strong>
        Project Options
      </Text>
      {renderOptions[selectedTech]() }
    </>
  );
};

export default SampleOptions;
