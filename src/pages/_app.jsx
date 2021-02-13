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
import getFromApiExpectOK from '../utils/getFromApiExpectOK';
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
    }
  }, [router.query.experimentId]);

  const { data: experimentData, error: experimentError } = useSWR(
    () => (experimentId ? `${getApiEndpoint()}/v1/experiments/${experimentId}` : null),
    getFromApiExpectOK,
  );

  const mainContent = () => {
    // If the page is statically rendered (on server), show a loading context.
    if (!isBrowser) {
      return (<PreloadContent />);
    }

    // If this is a not found error, show it without the navigation bar.
    if (Component === NotFoundPage) {
      return <Component {...pageProps} />;
    }

    // If the experiment ID does not exist and is not `false` (i.e. not necessary)
    // wait until the experiment ID is loaded before loading the page.
    if (!experimentId && experimentId !== false) {
      return (<PreloadContent />);
    }

    // If we found the experiment ID, but we haven't yet queried the API for data
    // about the experiment, wait until that is done.
    if (experimentId && !experimentData && !experimentError) {
      return (<PreloadContent />);
    }

    // If there was an error querying the API, display an error state.
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

    // Otherwise, load the page inside the content wrapper.
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
