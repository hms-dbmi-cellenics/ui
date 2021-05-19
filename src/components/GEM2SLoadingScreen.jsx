import React from 'react';
import {
  Result, Button, Progress, Row, Col, Typography, Space,
} from 'antd';
import Link from 'next/link';
import PropTypes from 'prop-types';

const { Title, Text } = Typography;

const GEM2SLoadingScreen = ({ gem2sStatus, completedSteps, steps }) => {
  const path = '/data-management';

  const gem2sStepsInfo = [
    'Downloading sample files',
    'Preprocessing samples',
    'Computing metrics',
    'Converting samples',
    'Preparing experiment',
    'Uploading completed data',
  ];

  // eslint-disable-next-line no-param-reassign
  steps = steps || gem2sStepsInfo;

  const texts = {
    toBeRun: {
      status: 'info',
      title: 'Let\'s upload and pre-process data your data.',
      subTitle: 'Your data needs to be uploaded and pre-processed before it can be explored. To begin, go to Data Management.',
      showProgress: false,
    },
    running: {
      status: 'running',
      showProgress: true,
      title: '',
      subTitle: '',
    },
    error: {
      status: 'error',
      title: 'We\'ve had an issue while launching your experiment.',
      subTitle: 'Please go to Data Management and try again.',
      showProgress: false,
    },
  };

  const { status, title, subTitle } = texts[gem2sStatus];

  const renderExtra = () => {
    if (gem2sStatus !== 'running') {
      return (
        <Link as={path} href={path} passHref>
          <Button type='primary' key='console'>
            Go to Data Management
          </Button>
        </Link>
      );
    }

    return (
      <Row>
        <Col span={8} offset={8}>
          <Space direction='vertical' size='large'>
            <br />
            <div>
              <Space direction='vertical' style={{ width: '100%' }}>
                <Progress strokeWidth={10} type='line' percent={Math.floor((completedSteps.length / steps.length) * 100)} />
                <Text type='secondary'>{(steps[Math.min(completedSteps.length, steps.length - 1)])}</Text>
              </Space>
            </div>
            <div>
              <Title level={3}>We're launching your analysis...</Title>
              <Text type='secondary'>You can wait or leave this screen and check again later</Text>
            </div>
          </Space>
        </Col>
      </Row>
    );
  };

  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      icon={(
        <img
          width={250}
          height={250}
          alt='A woman fitting an oversized clipboard next to other clipboards (illustration).'
          src='/undraw_Timeline_re_aw6g.svg'
          style={{
            display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '50%',
          }}
        />
      )}
      extra={renderExtra()}
    />
  );
};

GEM2SLoadingScreen.propTypes = {
  gem2sStatus: PropTypes.oneOf(['error', 'running', 'toBeRun']).isRequired,
  completedSteps: PropTypes.array,
  steps: PropTypes.array,
};

GEM2SLoadingScreen.defaultProps = {
  completedSteps: [],
  steps: [],
};

export default GEM2SLoadingScreen;
