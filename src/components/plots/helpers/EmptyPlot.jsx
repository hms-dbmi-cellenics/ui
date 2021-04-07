import React from 'react';
import {
  Empty, Typography,
} from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

const EmptyPlot = ({ mini }) => {
  if (mini) {
    return (
      <Empty
        style={{ width: 102 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<></>}
      />
    );
  }

  return (
    <Empty
      description={(
        <>
          <Text type='primary'>
            Nothing to show yet
          </Text>
          <br />
          <Text type='secondary'>
            Results will appear here when they&apos;re available.
          </Text>
        </>
      )}
    />
  );
};

EmptyPlot.propTypes = {
  mini: PropTypes.bool,
};

EmptyPlot.defaultProps = {
  mini: false,
};

export default EmptyPlot;
