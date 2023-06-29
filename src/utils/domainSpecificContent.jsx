import React from 'react';
import { AccountId } from 'utils/deploymentInfo';
import { Button } from 'antd';
import nextConfig from 'next/config';

const domainSpecificContent = {
  HMS: {

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
      </>
    ),
    Courses: (
      <Button>
        <a href='https://www.biomage.net/cellenicscourse' target='_blank' rel='noreferrer'>
          Courses
        </a>
      </Button>
    ),
  },
  nonHMS: {
    HelpButton: (
      <>
        Check out the
        {' '}
        <a href='https://www.biomage.net/user-guide' target='_blank' rel='noreferrer'>
          user guide
        </a>
        <br />
      </>
    ),
  },
};

export default function renderDomainSpecificContentContent(component) {
  const accountId = nextConfig()?.publicRuntimeConfig?.accountId;

  switch (accountId) {
    case AccountId.HMS:
      return domainSpecificContent.HMS[component];
    case AccountId.BIOMAGE:
      return (
        <>
          {domainSpecificContent.BIOMAGE[component]}
          {domainSpecificContent.nonHMS[component]}
        </>
      );
    default:
      return domainSpecificContent.nonHMS[component];
  }
}
