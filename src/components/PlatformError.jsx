import React from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Empty, Typography } from 'antd';
import PropTypes from 'prop-types';

const PlatformError = (props) => {
  const { description, onClick } = props;
  return (
    <Empty
      image={<Typography type='danger'><ExclamationCircleFilled style={{ fontSize: 40 }} /></Typography>}
      imageStyle={{
        height: 40,
      }}
      description={description}
    >
      <Button
        type='primary'
        onClick={onClick}
      >
        Try again
      </Button>
    </Empty>
  );
};

PlatformError.defaultProps = {};

PlatformError.propTypes = {
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default PlatformError;
