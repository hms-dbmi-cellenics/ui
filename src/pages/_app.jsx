/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress';
import useSWR from 'swr';
import ContentWrapper from '../components/ContentWrapper';
import PreloadContent from '../components/PreloadContent';
import NotFoundPage from './404';
import Error from './_error';
import isBrowser from '../utils/environment';
import wrapper from '../redux/store';
import getApiEndpoint from '../utils/apiEndpoint';
import { getFromApiExpectOK } from '../utils/cacheRequest';
import '../../assets/self-styles.less';
import '../../assets/nprogress.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const WrappedApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const [experimentId, setExperimentId] = useState(undefined);

  // Only hydrate pages when experiment ID is loaded.
  useEffect(() => {
    if (!router.route.includes('experimentId')) {
      setExperimentId(false);
    }

    if (router.route.includes('experimentId')) {
      setExperimentId(router.query.experimentId);
      console.log(experimentId, 'changed');
    }
  }, [router.query.experimentId]);

  const { data: experimentData, error: experimentError } = useSWR(
    () => (experimentId ? `${getApiEndpoint()}/v1/experiments/${experimentId}` : null),
    getFromApiExpectOK,
  );

  const mainContent = () => {
    if (!isBrowser) {
      return (<PreloadContent />);
    }

    if (Component === NotFoundPage) {
      return <Component {...pageProps} />;
    }

    if (!experimentId && experimentId !== false) {
      return (<PreloadContent />);
    }

    if (experimentId && !experimentData && !experimentError) {
      console.log(experimentId, experimentData, experimentError);

      return (<PreloadContent />);
    }

    if (experimentError) {
      if (experimentError.payload === undefined) {
        return <Error errorText='Cannot connect to API service.' />;
      }

      const { status } = experimentError.payload;

      if (status === 404) {
        return <NotFoundPage />;
      }

      return <Error statusCode={status} />;
    }

    return (
      <ContentWrapper>
        <Component
          experimentId={experimentId}
          experimentData={experimentData}
          route={router.route}
          {...pageProps}
        />
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

WrappedApp.propTypes = {
  Component: PropTypes.object.isRequired,
  pageProps: PropTypes.string.isRequired,
};

export default wrapper.withRedux(WrappedApp);
