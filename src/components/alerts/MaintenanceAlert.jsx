import React from 'react';
import { Alert } from 'antd';

const BrowserAlert = () => (
  <Alert
    showIcon
    message={(
      <>
        <b>Cellenics scheduled downtime.</b>
        {' '}
        We will be carrying out scheduled maintenance on Cellenics on Tuesday 14th June.
        The platform may be down for a few hours on this date.
        We apologise for the inconvenience.
      </>
    )}
    banner
    closable
    style={{
      position: 'fixed',
      top: 0,
      zIndex: 100,
      width: '100%',
      borderBottom: '1px solid #FFF0A3',
    }}
  />
);

export default BrowserAlert;
