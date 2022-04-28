import React from 'react';
import PropTypes from 'prop-types';
import { Result, Button, Typography } from 'antd';
import FeedbackButton from 'components/header/FeedbackButton';

const { Title } = Typography;

const NotFoundPage = ({ title, subTitle, hint }) => (
  <Result
    title={<Title level={2}>{title}</Title>}
    icon={(
      <img
        alt='People looking into bushes to find something (illustration).'
        src='/undraw_not_found_60pq.svg'
        width={250}
        height={250}
        style={{
          display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '50%',
        }}
      />
    )}
    subTitle={(
      <>
        <Title
          level={5}
          style={{ fontWeight: 'normal' }}
        >
          {subTitle}
          {hint && (
            <>
              <br />
              <span>{hint}</span>
            </>
          )}
        </Title>
      </>
    )}
    extra={(
      <>
        <Button type='primary' href='/'>
          Go home
        </Button>
        <FeedbackButton />
      </>
    )}
  />
);

NotFoundPage.defaultProps = {
  hint: '',
  title: 'Page not found',
  subTitle: 'We can\'t seem to find the page you\'re looking for.',
};

NotFoundPage.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  hint: PropTypes.string,
};

export default NotFoundPage;
