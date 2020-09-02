/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Provider } from 'react-redux';
import Head from 'next/head';
import App from 'next/app';
import withReduxStore from '../redux/with-redux-store';
import ContentWrapper from '../components/ContentWrapper';
import PreloadContent from '../components/PreloadContent';
import isBrowser from '../utils/environment';
import '../../assets/self-styles.less';

class MyApp extends App {
  // eslint-disable-next-line class-methods-use-this
  mainContent(Component, pageProps) {
    if (isBrowser) {
      return (
        <ContentWrapper>
          <Component {...pageProps} />
        </ContentWrapper>
      );
    }
    return (<PreloadContent />);
  }

  render() {
    const { Component, pageProps, store } = this.props;
    return (
      <Provider store={store}>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <title>Biomage</title>
        </Head>
        {this.mainContent(Component, pageProps)}
      </Provider>
    );
  }
}

export default withReduxStore(MyApp);
