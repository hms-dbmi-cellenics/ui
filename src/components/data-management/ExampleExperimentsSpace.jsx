import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography, Space, Button, Empty,
} from 'antd';

import { loadExperiments } from 'redux/actions/experiments';
import { setActiveProject } from 'redux/actions/projects';
import fetchAPI from 'utils/http/fetchAPI';

const { Paragraph, Text } = Typography;

const ExampleExperimentsSpace = ({ introductionText, imageStyle }) => {
  const dispatch = useDispatch();

  const environment = useSelector((state) => state?.networkResources?.environment);

  const [exampleExperiments, setExampleExperiments] = useState([]);

  useEffect(() => {
    if (!environment) return;

    fetchAPI('/v2/experiments/examples').then((experiments) => {
      setExampleExperiments(experiments);
    });
  }, [environment]);

  const cloneIntoCurrentExperiment = async (exampleExperimentId) => {
    const url = `/v2/experiments/${exampleExperimentId}/clone`;

    const newExperimentId = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    await dispatch(loadExperiments());
    await dispatch(setActiveProject(newExperimentId));
  };

  return (
    <Empty
      imageStyle={imageStyle}
      description={(
        <Space size='middle' direction='vertical'>
          <Paragraph>
            {introductionText}
          </Paragraph>
          {
            exampleExperiments.length > 0 && (
              <>
                <Text>
                  Don&apos;t have data? Get started using one of our example datasets:
                </Text>
                <div style={{ width: 'auto', textAlign: 'left' }}>
                  <ul>
                    {
                      exampleExperiments.map(({ id, name }) => (
                        <li key={name}>
                          <Button
                            type='link'
                            size='small'
                            onClick={() => cloneIntoCurrentExperiment(id)}
                          >
                            {name}
                          </Button>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </>
            )
          }
        </Space>
      )}
    />
  );
};

ExampleExperimentsSpace.defaultProps = {
  introductionText: '',
  imageStyle: {},
};

ExampleExperimentsSpace.propTypes = {
  introductionText: PropTypes.string,
  imageStyle: PropTypes.object,
};

export default ExampleExperimentsSpace;
