import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { getTrackingDetails } from 'utils/tracking';
import { AccountId } from 'utils/deploymentInfo';
import nextConfig from 'next/config';

const TagManager = ({ environment }) => {
  const { enabled, containerId } = getTrackingDetails(environment);
  const accountId = nextConfig()?.publicRuntimeConfig?.accountId;
  // if tracking is not enabled don't add tag manager to the head
  if (!enabled) return (null);

  // whether to use biomage or HMS matomo account
  const matomoName = accountId === AccountId.BIOMAGE ? 'biomage' : 'cellenics';

  const mtmTrackingCode = `var _mtm = window._mtm = window._mtm || [];
            _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.async=true; g.src='https://cdn.matomo.cloud/${matomoName}.matomo.cloud/container_${containerId}.js'; s.parentNode.insertBefore(g,s);`;

  return (
    <Head>
      <script key='mtm' dangerouslySetInnerHTML={{ __html: mtmTrackingCode }} />
    </Head>
  );
};

TagManager.propTypes = {
  environment: PropTypes.oneOf(['development', 'staging', 'production']).isRequired,
};

export default TagManager;
