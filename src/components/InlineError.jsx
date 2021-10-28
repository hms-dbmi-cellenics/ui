import React from 'react';
import PropTypes from 'prop-types';

import {
  Typography,
  Button,
  Space,
} from 'antd';

const { Text } = Typography;

const InlineError = (props) => {
  const { message, actionable, onClick } = props;

  return (
    <Space size='middle'>
      <Text>
        {message}
      </Text>
      {
        actionable
        && (
          <Button type='primary' onClick={onClick} size='small'>
            Retry
          </Button>
        )
      }
    </Space>
  );
};

InlineError.propTypes = {
  message: PropTypes.string,
  actionable: PropTypes.bool,
  onClick: PropTypes.func,
};

InlineError.defaultProps = {
  message: 'Error loading data',
  actionable: false,
  onClick: () => {},
};

export default InlineError;
