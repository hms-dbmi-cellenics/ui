import React from 'react';
import {
  Result, Button, Progress, Row, Col, Typography, Space,
} from 'antd';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import PropTypes from 'prop-types';

import runGem2s from '../redux/actions/pipeline/runGem2s';

const { Title, Text } = Typography;

const gem2sStepsInfo = [
  'Downloading sample files',
  'Preprocessing samples',
  'Computing metrics',
  'Converting samples',
  'Preparing experiment',
  'Uploading completed data',
];

const GEM2SLoadingScreen = (props) => {
  const { gem2sStatus, completedSteps, experimentId } = props;

  const dispatch = useDispatch();

  const dataManagementPath = '/data-management';
  const relaunchExperiment = () => {
    dispatch(runGem2s(experimentId));
  };

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
      subTitle: 'You can launch another experiment or retry launching this experiment.',
      showProgress: false,
    },
  };

  const { status, title, subTitle } = texts[gem2sStatus];

  const renderExtra = () => {
    if (gem2sStatus === 'info') {
      return (
        <Link as={dataManagementPath} href={dataManagementPath} passHref>
          <Button type='primary' key='console'>
            Go to Data Management
          </Button>
        </Link>
      );
    }

    if (gem2sStatus === 'error') {
      return (
        <Space size='large'>
          <Link as={dataManagementPath} href={dataManagementPath} passHref>
            <Button type='primary' key='console'>
              Launch Another Experiment
            </Button>
          </Link>
          <Button type='primary' key='console' onClick={relaunchExperiment}>
            Re-launch Experiment
          </Button>
        </Space>
      );
    }

    return (
      <Row>
        <Col span={8} offset={8}>
          <Space direction='vertical' size='large'>
            <br />
            <div>
              <Space direction='vertical' style={{ width: '100%' }}>
                <Progress strokeWidth={10} type='line' percent={Math.floor((completedSteps.length / gem2sStepsInfo.length) * 100)} />
                <Text type='secondary'>{(gem2sStepsInfo[completedSteps.length])}</Text>
              </Space>
            </div>
            <div>
              <Title level={3}>We&apos;re launching your analysis...</Title>
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
  experimentId: PropTypes.string,
};

GEM2SLoadingScreen.defaultProps = {
  completedSteps: [],
  experimentId: null,
};

export default GEM2SLoadingScreen;
