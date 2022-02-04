import React from 'react';
import {
  PageHeader, Space,
} from 'antd';
import PropTypes from 'prop-types';
import { NextSeo } from 'next-seo';
import { useSelector } from 'react-redux';
import UserButton from 'components/UserButton';
import FeedbackButton from 'components/FeedbackButton';
import ReferralButton from 'components/ReferralButton';
import integrationTestConstants from 'utils/integrationTestConstants';
import { ClipLoader } from 'react-spinners';

const Header = (props) => {
  const {
    experimentId, experimentData, title, extra, loading,
  } = props;
  const experiment = useSelector((state) => state?.experiments[experimentId]);
  const experimentName = experimentData?.experimentName || experiment?.name;

  const truncateText = (text) => (
    (text && text.length > 28) ? `${text.substr(0, 27)}…` : text
  );

  const renderPageHeaderElements = () => (
    <Space size='large' align='center'>
      { loading
        ? (
          <ClipLoader
            size={24}
            color='#8f0b10'
          />
        ) : <></>}
      <Space>
        <FeedbackButton />
        <ReferralButton />
        {extra}
      </Space>
      <UserButton />
    </Space>
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
        extra={renderPageHeaderElements()}
      />
    </>
  );
};

Header.propTypes = {
  experimentId: PropTypes.string,
  experimentData: PropTypes.object,
  title: PropTypes.string.isRequired,
  extra: PropTypes.node,
  loading: PropTypes.bool,
};

Header.defaultProps = {
  experimentId: null,
  experimentData: null,
  extra: <></>,
  loading: false,
};

export default Header;
