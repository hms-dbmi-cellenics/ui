import React from 'react';
import PropTypes from 'prop-types';
import { Result, Button, Typography } from 'antd';
import { Auth } from 'aws-amplify';
import FeedbackButton from '../components/FeedbackButton';

const { Title } = Typography;

const UnauthorizedPage = ({ title, subTitle, hint }) => (
  <Result
    title={<Title level={2}>{title}</Title>}
    icon={(
      <img
        alt='People looking into bushes to find something (illustration).'
        src='/undraw_cancel_u1it.svg'
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
        <Button type='primary' onClick={() => Auth.federatedSignIn()}>
          Log in
        </Button>
        <FeedbackButton />
      </>
    )}
  />
);

UnauthorizedPage.defaultProps = {
  hint: '',
  title: 'Unauthorized',
  subTitle: 'Login to continue',
};

UnauthorizedPage.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  hint: PropTypes.string,
};

export default UnauthorizedPage;
