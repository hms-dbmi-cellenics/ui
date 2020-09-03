import React from 'react';
import {
  Button, Empty, Typography,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

const renderError = (err, onTryAgain) => (
  <Empty
    image={(
      <Text type='danger'>
        <ExclamationCircleFilled style={{ fontSize: 40 }} />
      </Text>
    )}
    imageStyle={{
      height: 40,
    }}
    description={
      err
    }
  >
    <Button
      type='primary'
      onClick={() => onTryAgain()}
    >
      Try again
    </Button>
  </Empty>
);

export default renderError;
