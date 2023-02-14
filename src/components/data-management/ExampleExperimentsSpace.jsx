import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography, Space, Button, Empty,
} from 'antd';
import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';

const { Paragraph } = Typography;

const ExampleExperimentsSpace = ({ introductionText, imageStyle }) => {
  const { navigateTo } = useAppRouter();

  return (
    <Empty
      imageStyle={imageStyle}
      description={(
        <Space size='middle' direction='vertical'>
          <Paragraph>
            {introductionText}
          </Paragraph>
          <Button
            type='primary'
            block
            onClick={() => { navigateTo(modules.REPOSITORY); }}
          >
            Don&apos;t have data? Get started using one of our example datasets!
          </Button>
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
