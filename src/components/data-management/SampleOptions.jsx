/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Typography, Checkbox, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { technologies } from 'utils/upload/fileUploadSpecifications';

const { Text, Paragraph } = Typography;

const technologyHasOptions = [
  technologies.rhapsody,
];

const SampleOptions = () => {
  const dispatch = useDispatch();

  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const selectedTech = useSelector((state) => state.samples[activeExperiment?.sampleIds[0]]?.type);

  const updateAllSamples = (value) => {};

  const render = () => {
    if (selectedTech === technologies.rhapsody) {
      return (
        <>
          <Paragraph>
            <Checkbox onChange={(e) => updateAllSamples(e.target.value)}>
              Include AbSeq data
              {' '}
              <Tooltip title='AbSeq data is filtered out by default. Checking this box includes the AbSeq data. Support for AbSeq is currently for visualization purposes only, as experiment-wide normalization will be slightly skewed. In case there is AbSeq data in your experiment, we suggest you create two projects; one including AbSeq data and one without, and compare the results.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </Checkbox>
          </Paragraph>
        </>
      );
    }
  };

  if (!technologyHasOptions.includes(selectedTech)) return <></>;

  return (
    <>
      <Text strong>
        Project Options
      </Text>
      { render() }
    </>
  );
};

export default SampleOptions;
