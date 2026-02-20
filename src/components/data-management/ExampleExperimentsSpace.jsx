import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography, Space, Button, Empty,
} from 'antd';
import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';

const { Paragraph } = Typography;

const ExampleExperimentsSpace = ({ introductionText, imageStyle, buttonType }) => {
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
            type={buttonType}
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
  buttonType: 'default',
};

ExampleExperimentsSpace.propTypes = {
  introductionText: PropTypes.string,
  imageStyle: PropTypes.object,
  buttonType: PropTypes.string,
};

export default ExampleExperimentsSpace;
