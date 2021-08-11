import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Space,
  Typography,
  Dropdown,
  Card,
} from 'antd';

import { useSelector } from 'react-redux';

import {
  CheckCircleOutlined,
} from '@ant-design/icons';

import PrettyTime from '../PrettyTime';
import StepsIndicator from './StepsIndicator';
import pipelineStatus from '../../utils/pipelineStatusValues';

const { Text, Paragraph } = Typography;

const StatusIndicator = (props) => {
  const { allSteps, currentStep, completedSteps } = props;

  const {
    status: { pipeline },
  } = useSelector((state) => state.experimentSettings.backendStatus);

  const mockPipelineData = {
    startDate: '2021-01-01T00:00:00',
    stopDate: '2021-01-01T00:00:00',
    status: pipelineStatus.SUCCEEDED,
  };

  const {
    startDate, stopDate, status, error,
  } = pipeline || mockPipelineData;

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
      icon: <Text strong type='success' style={{ fontSize: '1.2rem' }}><CheckCircleOutlined /></Text>,
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
        <Text>{`${completedSteps?.length || 0} of ${allSteps.length} steps complete`}</Text>
      </Paragraph>
      <Paragraph>
        {statusIndicators[status].description}
      </Paragraph>
    </Card>
  );

  return (
    <Dropdown overlay={renderOverlay}>
      <Button
        type='text'
        style={{ paddingTop: '1px' }}
      >
        <Space size='small'>
          <Text strong style={{ fontSize: '0.9rem' }}>
            Status:
          </Text>
          <StepsIndicator
            allSteps={allSteps}
            currentStep={currentStep}
            completedSteps={completedSteps?.length || []}
          />
          <div style={{ display: 'inline-block' }}>
            {statusIndicators[status].icon}
          </div>
        </Space>
      </Button>
    </Dropdown>
  );
};

StatusIndicator.propTypes = {
  allSteps: PropTypes.array.isRequired,
  currentStep: PropTypes.number.isRequired,
  completedSteps: PropTypes.number.isRequired,
};
export default StatusIndicator;
