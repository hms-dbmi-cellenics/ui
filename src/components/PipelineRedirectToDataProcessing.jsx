import React from 'react';
import {
  Result, Button,
} from 'antd';
import Link from 'next/link';
import PropTypes from 'prop-types';

const PipelineRedirectToDataProcessing = ({ experimentId, pipelineStatus }) => {
  const path = '/experiments/[experimentId]/data-processing';

  const texts = {
    error: {
      status: 'error',
      title: 'We\'ve had an issue while working on your project.',
      subTitle: 'Please go to Data Processing and try again.',
    },
    running: {
      status: 'info',
      title: 'We\'re working on your project...',
      subTitle: 'You can check the progress we\'ve made in Data Processing.',
    },
    toBeRun: {
      status: 'info',
      title: 'Let\'s process your data first.',
      subTitle: 'You need to process your data before it can be explored. To begin, go to Data Processing.',
    },
    runningStep: {
      status: 'info',
      title: 'Your data is getting ready.',
      subTitle: 'We\'re preparing the data for this step, please wait. This will take a few minutes.',
    },
  };

  const { status, title, subTitle } = texts[pipelineStatus];

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
      extra={pipelineStatus !== 'runningStep' && (
        <Link as={path.replace('[experimentId]', experimentId)} href={path} passHref>
          <Button type='primary' key='console'>
            Go to Data Processing
          </Button>
        </Link>
      )}
    />
  );
};

PipelineRedirectToDataProcessing.propTypes = {
  experimentId: PropTypes.string.isRequired,
  pipelineStatus: PropTypes.oneOf(['error', 'running', 'runningStep']).isRequired,
};

export default PipelineRedirectToDataProcessing;
