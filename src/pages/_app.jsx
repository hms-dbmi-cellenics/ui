/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Head from 'next/head';
import Router from 'next/router';
import NProgress from 'nprogress';
import ContentWrapper from '../components/ContentWrapper';
import PreloadContent from '../components/PreloadContent';

import NotFoundPage from './404';
import Error from './_error';

import isBrowser from '../utils/environment';
import wrapper from '../redux/store';
import '../../assets/self-styles.less';
import '../../assets/nprogress.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const WrappedApp = ({ Component, pageProps }) => {
  const mainContent = () => {
    if (Component === Error || Component === NotFoundPage) {
      return <Component {...pageProps} />;
    }

    if (!isBrowser) {
      return (<PreloadContent />);
    }

    return (
      <ContentWrapper>
        <Component {...pageProps} />
      </ContentWrapper>
    );
  };

  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>Cellscope</title>
      </Head>
      {mainContent(Component, pageProps)}
    </>
  );
};

export default wrapper.withRedux(WrappedApp);
