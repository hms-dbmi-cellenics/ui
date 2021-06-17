import React from 'react';
// import PropTypes from 'prop-types';
import {
  Button,
  Space,
  Typography,
  Dropdown,
  Card,
} from 'antd';

import { useSelector } from 'react-redux';

import {
  DownOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import PrettyTime from '../PrettyTime';
import pipelineStatus from '../../utils/pipelineStatusValues';

const { Text, Paragraph } = Typography;

const StatusIndicator = () => {
  const {
    status: { pipeline },
  } = useSelector((state) => state.experimentSettings.backendStatus);

  const {
    startDate, stopDate, status, error,
  } = pipeline;

  const statusIndicators = {
    [pipelineStatus.NOT_CREATED]: {
      icon: <Text strong type='secondary'>to be started</Text>,
      title: 'to be started',
      description: (
        <Text>You have never submitted your analysis to data processing.</Text>
      ),
    },
    [pipelineStatus.RUNNING]: {
      icon: <Text strong type='warning'>running</Text>,
      title: <Text strong type='warning'>running</Text>,
      description: (
        <Text>
          The analysis launched
          {' '}
          <PrettyTime isoTime={startDate} />
          {' '}
          and is now in progress. This will take a few minutes.
        </Text>
      ),
    },
    [pipelineStatus.FAILED]: {
      icon: <Text strong type='danger'>failed</Text>,
      title: <Text strong type='danger'>failing</Text>,
      description: (
        <Text>
          <b>Reason: </b>
          {' '}
          {error?.error}
          <br />
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
    [pipelineStatus.ABORTED]: {
      icon: <Text strong type='secondary'>stopped</Text>,
      title: <Text strong type='secondary'>stopped</Text>,
      description: (
        <Text>
          The analysis launched
          {' '}
          <PrettyTime isoTime={startDate} />
          {' '}
          and was stopped
          {' '}
          <PrettyTime isoTime={stopDate} />
          .
        </Text>
      ),
    },
    [pipelineStatus.SUCCEEDED]: {
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
          Status:
          {statusIndicators[status].icon}
          <Text type='secondary'><DownOutlined /></Text>
        </Space>
      </Button>
    </Dropdown>
  );
};

StatusIndicator.propTypes = {};
export default StatusIndicator;
