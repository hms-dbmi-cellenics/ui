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

import PrettyTime from 'components/PrettyTime';
import StepsIndicator from 'components/data-processing/StepsIndicator';
import pipelineStatus from 'utils/pipelineStatusValues';
import integrationTestConstants from 'utils/integrationTestConstants';
import { getBackendStatus } from 'redux/selectors';

const { Text, Paragraph } = Typography;

const StatusIndicator = (props) => {
  const {
    experimentId, allSteps, currentStep, completedSteps,
  } = props;

  const {
    status: backendStatus,
    loading: loadingBackendStatus,
    error: errorLoadingBackendStatus,
  } = useSelector(getBackendStatus(experimentId));

  const pipelineHadErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'].includes(backendStatus.pipeline.status);

  const {
    startDate, stopDate, status, error,
  } = backendStatus?.pipeline || {};

  const statusIndicators = {
    [pipelineStatus.NOT_CREATED]: {
      icon: <Text strong type='secondary' data-test-id={integrationTestConstants.ids.QC_STATUS_TEXT}>to be started</Text>,
      title: 'to be started',
      description: (
        <Text>You have never submitted your analysis to data processing.</Text>
      ),
    },
    [pipelineStatus.RUNNING]: {
      icon: <Text strong type='warning' data-test-id={integrationTestConstants.ids.QC_STATUS_TEXT}>running</Text>,
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
      icon: <Text strong type='danger' data-test-id={integrationTestConstants.ids.QC_STATUS_TEXT}>failed</Text>,
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
      icon: <Text strong type='secondary' data-test-id={integrationTestConstants.ids.QC_STATUS_TEXT}>stopped</Text>,
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
      icon: <Text strong type='success' style={{ fontSize: '1.2rem' }} data-test-id={integrationTestConstants.ids.QC_STATUS_TEXT}><CheckCircleOutlined /></Text>,
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

  const renderOverlay = () => {
    const renderOverlayContent = () => {
      if (loadingBackendStatus) { return (<Text>Loading run status...</Text>); }
      if (errorLoadingBackendStatus) {
        return (<Text>Failed loading run status. Please refresh the page.</Text>);
      }

      return (
        <>
          <Paragraph>
            <Text strong>
              Your data processing is
              {' '}
              {statusIndicators[status].title}
              .
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>{`${completedSteps.length} of ${allSteps.length} steps complete`}</Text>
          </Paragraph>
          <Paragraph>
            {statusIndicators[status]?.description}
          </Paragraph>
        </>
      );
    };

    return (
      <Card style={{ width: 300, padding: 16 }}>
        {renderOverlayContent()}
      </Card>
    );
  };

  const renderIndicator = () => {
    if (loadingBackendStatus) { return (<Text>loading</Text>); }
    if (errorLoadingBackendStatus) { return (<Text>error</Text>); }

    return (
      <>
        <StepsIndicator
          allSteps={allSteps}
          currentStep={currentStep}
          completedSteps={completedSteps.length}
          pipelineHadErrors={pipelineHadErrors}
        />
        <div style={{ display: 'inline-block' }}>
          {statusIndicators[status]?.icon}
        </div>
      </>
    );
  };

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
          {renderIndicator()}
        </Space>
      </Button>
    </Dropdown>
  );
};

StatusIndicator.propTypes = {
  experimentId: PropTypes.string.isRequired,
  allSteps: PropTypes.array.isRequired,
  currentStep: PropTypes.number.isRequired,
  completedSteps: PropTypes.array.isRequired,
};
export default StatusIndicator;
