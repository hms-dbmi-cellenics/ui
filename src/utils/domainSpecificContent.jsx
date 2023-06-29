import React from 'react';
import { AccountId } from 'utils/deploymentInfo';
import { Button } from 'antd';

const domainSpecific = {
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
      </>
    ),
  },
};

export default function returnDomainSpecificContent(component, accountId) {
  switch (accountId) {
    case AccountId.HMS:
      return domainSpecific.HMS[component];
    case AccountId.BIOMAGE:
      return (
        <>
          {domainSpecific.BIOMAGE[component]}
          {domainSpecific.nonHMS[component]}
        </>
      );
    default:
      return domainSpecific.nonHMS[component];
  }
}
