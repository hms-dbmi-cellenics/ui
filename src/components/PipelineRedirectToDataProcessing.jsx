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
      image: '/undraw_Abstract_re_l9xy.svg',
      alt: 'A woman confusedly staring at an abstract drawing.',
    },
    running: {
      status: 'info',
      title: 'We\'re working on your project...',
      subTitle: 'You can check the progress we\'ve made in Data Processing.',
      image: '/undraw_Dev_focus_re_6iwt.svg',
      alt: 'A woman working in front of a computer.',
    },
    toBeRun: {
      status: 'info',
      title: 'Let\'s process your data first.',
      subTitle: 'You need to process your data before it can be explored. To begin, go to Data Processing.',
      image: '/undraw_To_the_stars_qhyy.svg',
      alt: 'A rocket ship ready for take-off.',
    },
    runningStep: {
      status: 'info',
      title: 'Your data is getting ready.',
      subTitle: 'We\'re preparing the data for this step, please wait. This will take a few minutes.',
      image: '/undraw_tasks_re_v2v4.svg',
      alt: 'A woman in a wheelchair looking at a list of partially completed items.',
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
