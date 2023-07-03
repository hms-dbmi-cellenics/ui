import React from 'react';
import { AccountId } from 'utils/deploymentInfo';
import { Button } from 'antd';
import nextConfig from 'next/config';

const reusedContent = {
  HelpButton: (
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
};
const domainSpecificContent = {
  HMS: {

  },
  COMMUNITY_INSTANCE: {
    HelpButton: (
      <>
        Ask questions about how to use Cellenics and make feature requests on the
        {' '}
        <a href='https://community.biomage.net/' target='_blank' rel='noreferrer'>Cellenics community forum</a>
        !
        The Biomage team will reply to your message as soon as possible.
        <br />
        <br />
        {reusedContent.HelpButton}
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
  THIRD_PARTY: {
    HelpButton: reusedContent.HelpButton,
  },
};

export default function renderDomainSpecificContent(component) {
  const accountId = nextConfig()?.publicRuntimeConfig?.accountId;
  switch (accountId) {
    case AccountId.HMS:
      return domainSpecificContent.HMS[component];
    case AccountId.BIOMAGE:
      return domainSpecificContent.COMMUNITY_INSTANCE[component];
    default:
      return domainSpecificContent.THIRD_PARTY[component];
  }
}
