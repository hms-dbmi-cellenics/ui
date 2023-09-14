import React from 'react';
import {
  Result, Button, Progress, Row, Col, Typography, Space,
} from 'antd';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { retry } from 'redux/actions/pipeline';
import NotifyByEmail from './NotifyByEmail';

const { Title, Text } = Typography;

const pipelineStepsInfoByType = {
  gem2s: [
    'Downloading sample files',
    'Preprocessing samples',
    'Computing metrics',
    'Converting samples',
    'Preparing analysis',
    'Uploading completed data',
  ],

  seurat: [
    'Downloading RDS file',
    'Processing Seurat object',
    'Uploading completed data',
  ],
};

const GEM2SLoadingScreen = (props) => {
  const {
    pipelineStatus,
    completedSteps,
    experimentId,
    experimentName,
    pipelineType,
    pipelineErrorMessage,
  } = props;

  const pipelineStepsInfo = pipelineStepsInfoByType[pipelineType];
  const dispatch = useDispatch();

  const dataManagementPath = '/data-management';
  const relaunchExperiment = async () => {
    await dispatch(retry(experimentId));
  };

  const texts = {
    toBeRun: {
      status: 'toBeRun',
      title: 'Let\'s upload and pre-process your data.',
      subTitle: 'Your data needs to be uploaded and pre-processed before it can be explored. To begin, go to Data Management.',
      showProgress: false,
      image: '/undraw_To_the_stars_qhyy.svg',
      alt: 'A rocket ship ready for take-off.',
    },
    running: {
      status: 'running',
      showProgress: true,
      title: ' ',
      subTitle: ' ',
      image: '/undraw_Dev_focus_re_6iwt.svg',
      alt: 'A woman working in front of a computer.',
    },
    error: {
      status: 'error',
      title: 'We\'ve had an issue while launching your analysis.',
      subTitle: pipelineErrorMessage || 'You can launch another analysis or retry to launch the current analysis.',
      image: '/undraw_Abstract_re_l9xy.svg',
      alt: 'A woman confusedly staring at an abstract drawing.',
      showProgress: false,
    },
    subsetting: {
      status: 'running',
      showProgress: true,
      title: ' ',
      subTitle: ' ',
      image: '/undraw_Dev_focus_re_6iwt.svg',
      alt: 'A woman working in front of a computer.',
    },
  };

  const {
    status, title, subTitle, image, alt,
  } = texts[pipelineStatus];

  const renderExtra = () => {
    if (pipelineStatus === 'toBeRun') {
      return (
        <Link as={dataManagementPath} href={dataManagementPath} passHref>
          <Button type='primary' key='console'>
            Go to Data Management
          </Button>
        </Link>
      );
    }

    if (pipelineStatus === 'error') {
      return (
        <Space size='large'>
          <Link as={dataManagementPath} href={dataManagementPath} passHref>
            <Button type='primary' key='console'>
              Launch Another Analysis
            </Button>
          </Link>
          <Button type='primary' key='console' onClick={relaunchExperiment}>
            Re-launch Current Analysis
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
                <Progress strokeWidth={10} type='line' percent={Math.floor((completedSteps.length / pipelineStepsInfo.length) * 100)} />
                <Text type='secondary'>{(pipelineStepsInfo[completedSteps.length])}</Text>
              </Space>
            </div>
            <div>
              {pipelineStatus === 'subsetting' && (
                <Title level={3}>
                  Subsetting cell sets into
                  <br />
                  {experimentName}
                </Title>
              )}
              {pipelineStatus === 'running' && (<Title level={3}>We&apos;re launching your analysis...</Title>)}
              <Text type='secondary'>You can wait or leave this screen and check again later.</Text>
              {pipelineStatus === 'subsetting' && (
                <Text type='secondary'>
                  <br />
                  Your new project containing only the selected cell sets will be available in the Data Management module
                </Text>
              )}
            </div>
            <NotifyByEmail experimentId={experimentId} />
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
          alt={alt}
          src={image}
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
  pipelineStatus: PropTypes.oneOf(['error', 'running', 'toBeRun', 'subsetting']).isRequired,
  pipelineType: PropTypes.oneOf(['gem2s', 'seurat']).isRequired,
  completedSteps: PropTypes.array,
  experimentId: PropTypes.string,
  experimentName: PropTypes.string,
  pipelineErrorMessage: PropTypes.string,
};

GEM2SLoadingScreen.defaultProps = {
  completedSteps: [],
  experimentId: null,
  experimentName: null,
  pipelineErrorMessage: null,
};

export default GEM2SLoadingScreen;
