/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Provider } from 'react-redux';
import Head from 'next/head';
import App from 'next/app';
import withReduxStore from '../redux/with-redux-store';
import ContentWrapper from '../components/content-wrapper/ContentWrapper';

import '../../assets/self-styles.less';

class MyApp extends App {
  render() {
    const { Component, pageProps, store } = this.props;
    return (
      <Provider store={store}>
        <Head>
          <title>Biomage</title>
        </Head>
        <ContentWrapper>
          <Component {...pageProps} />
        </ContentWrapper>
      </Provider>
    );
  }
}

export default withReduxStore(MyApp);
