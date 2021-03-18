import React from 'react';
// import PropTypes from 'prop-types';
import {
  Button,
  Space,
  Typography,
  Dropdown,
  Card,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';

import {
  LoadingOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import PrettyTime from '../PrettyTime';

const { Text, Paragraph } = Typography;

const StatusIndicator = () => {
  const {
    status: { pipeline },
  } = useSelector((state) => state.experimentSettings.pipelineStatus);

  const { startDate, stopDate, status } = pipeline;

  const statusIndicators = {
    NotCreated: {
      icon: <QuestionCircleOutlined />,
      title: 'to be started',
      description: (
        <Text>You have never submitted your analysis to data processing.</Text>
      ),
    },
    RUNNING: {
      icon: <Text strong type='warning'><LoadingOutlined /></Text>,
      title: <Text strong type='warning'>running</Text>,
      description: (
        <Text>
          The analysis launched
          {' '}
          <PrettyTime isoTime={startDate} />
          {' '}
          and is now in progress.
        </Text>
      ),
    },
    FAILED: {
      icon: <Text strong type='danger'><WarningOutlined /></Text>,
      title: <Text strong type='danger'>failing</Text>,
      description: (
        <Text>
          The analysis launched
          {' '}
          <PrettyTime isoTime={startDate} />
          {' '}
          and failed
          {' '}
          <PrettyTime isoTime={stopDate} />
          .
        </Text>
      ),
    },
    SUCCEEDED: {
      icon: <Text strong type='success'><CheckCircleOutlined /></Text>,
      title: <Text strong type='success'>finished</Text>,
      description: (
        <Text>
          The analysis launched
          {' '}
          <PrettyTime isoTime={startDate} />
          {' '}
          and finished
          {' '}
          <PrettyTime isoTime={stopDate} />
          .
        </Text>
      ),
    },
  };

  const renderOverlay = () => (
    <Card style={{ width: 300, padding: 16 }}>
      <Paragraph>
        <Text strong>
          Your data processing is
          {' '}
          {statusIndicators[status].title}
          .
        </Text>
      </Paragraph>
      <Paragraph>
        {statusIndicators[status].description}
      </Paragraph>

    </Card>
  );

  return (
    <Dropdown overlay={renderOverlay}>
      <Button type='text'>
        <Space>
          <span>Status:</span>
          {statusIndicators[status].icon}
          <Text type='secondary'><DownOutlined /></Text>
        </Space>
      </Button>
    </Dropdown>
  );
};

StatusIndicator.propTypes = {};
export default StatusIndicator;
