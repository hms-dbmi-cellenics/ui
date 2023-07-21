import React from 'react';
import { AccountId } from 'utils/deploymentInfo';
import { Button } from 'antd';
import nextConfig from 'next/config';
import config from 'config';

const reusedContent = {
  HelpButton: {
    BiomageUserGuide: (
      <>
        Check out the
        {' '}
        <a href='https://www.biomage.net/user-guide' target='_blank' rel='noreferrer'>
          user guide
          {' '}
        </a>
        and
        {' '}
        <a href='https://www.youtube.com/@biomageltd4616/featured' target='_blank' rel='noreferrer'> tutorial videos </a>
        <br />
      </>
    ),
    OneToOneSupport: (
      <>
        For 1-2-1 support with your analysis, contact
        {' '}
        <a href={`mailto: ${config.supportEmail}`}>{config.supportEmail}</a>
      </>
    ),
  },
};
const domainSpecificContent = {
  HMS: {
    HelpButton: reusedContent.HelpButton.OneToOneSupport,
  },
  BIOMAGE: {
    HelpButton: (
      <>
        Ask questions about how to use Cellenics and make feature requests on the
        {' '}
        <a href='https://community.biomage.net/' target='_blank' rel='noreferrer'>Cellenics community forum</a>
        !
        The Biomage team will reply to your message as soon as possible.
        <br />
        <br />
        {reusedContent.HelpButton.BiomageUserGuide}
      </>
    ),
    HeaderExtraButton: (
      <Button>
        <a href='https://www.biomage.net/cellenicscourse' target='_blank' rel='noreferrer'>
          Courses
        </a>
      </Button>
    ),
  },
  BIOMAGE_PRIVATE: {
    HelpButton: (
      <>
        {reusedContent.HelpButton.BiomageUserGuide}
        <br />
        {reusedContent.HelpButton.OneToOneSupport}
      </>
    ),
  },
};

export default function renderDomainSpecificContent(component) {
  const accountId = nextConfig()?.publicRuntimeConfig?.accountId;

  switch (accountId) {
    case AccountId.HMS:
      return domainSpecificContent.HMS[component];
    case AccountId.BIOMAGE:
      return domainSpecificContent.BIOMAGE[component];
    default:
      return domainSpecificContent.BIOMAGE_PRIVATE[component];
  }
}
