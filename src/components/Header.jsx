import React from 'react';
import {
  PageHeader, Space,
} from 'antd';
import PropTypes from 'prop-types';
import { NextSeo } from 'next-seo';
import { useSelector } from 'react-redux';
import UserButton from './UserButton';
import FeedbackButton from './FeedbackButton';
import ReferralButton from './ReferralButton';
import integrationTestConstants from '../utils/integrationTestConstants';

const Header = (props) => {
  const {
    experimentId, experimentData, title, extra,
  } = props;
  const experiment = useSelector((state) => state?.experiments[experimentId]);
  const experimentName = experimentData?.experimentName || experiment?.name;

  const truncateText = (text) => (
    (text && text.length > 28) ? `${text.substr(0, 27)}…` : text
  );

  return (
    <>
      <NextSeo
        title={experimentData ? `${title} · ${truncateText(experimentName)}` : title}
      />

      <PageHeader
        className={integrationTestConstants.classes.PAGE_HEADER}
        title={title}
        style={{ width: '100%', paddingTop: '10px', paddingBottom: '10px' }}
        extra={(
          <Space size='large'>
            <Space>
              <FeedbackButton />
              <ReferralButton />
              {extra}
            </Space>
            <UserButton />
          </Space>
        )}
      />
    </>
  );
};

Header.propTypes = {
  experimentId: PropTypes.string,
  experimentData: PropTypes.object,
  title: PropTypes.string.isRequired,
  extra: PropTypes.node,
};

Header.defaultProps = {
  experimentId: null,
  experimentData: null,
  extra: <></>,
};

export default Header;
