import React from 'react';
import { Alert } from 'antd';

const BrowserAlert = () => {
  const renderContent = () => {
    if (navigator.userAgent.match('Chrome')) return <></>;

    return (
      <Alert
        showIcon
        message={(
          <>
            <b>Browser not supported.</b>
            {' '}
            We recommend switching to Google Chrome for the best Cellenics experience.`
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
  };

  return renderContent();
};

export default BrowserAlert;
