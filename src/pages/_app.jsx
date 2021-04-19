/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { DefaultSeo } from 'next-seo';
import Head from 'next/head';
import PropTypes from 'prop-types';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress';
import useSWR from 'swr';

import ContentWrapper from '../components/ContentWrapper';
import PreloadContent from '../components/PreloadContent';
import NotFoundPage from './404';
import Error from './_error';
import wrapper from '../redux/store';
import getApiEndpoint from '../utils/apiEndpoint';
import getFromApiExpectOK from '../utils/getFromApiExpectOK';
import '../../assets/self-styles.less';
import '../../assets/nprogress.css';

import { isBrowser, getCurrentEnvironment } from '../utils/environment';
import setupAmplify from '../utils/setupAmplify';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const WrappedApp = ({ Component, pageProps, req }) => {
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

    setupAmplify(getCurrentEnvironment());
  }, [router.query.experimentId]);

  const { data: experimentData, error: experimentError } = useSWR(
    () => (experimentId ? `${getApiEndpoint()}/v1/experiments/${experimentId}` : null),
    getFromApiExpectOK,
  );

  const mainContent = () => {
    // If the page is statically rendered (on server), show a loading context.
    if (!isBrowser) {
      return (
        <PreloadContent />
      );
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
      <ContentWrapper experimentId={experimentId} experimentData={experimentData}>
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
      <DefaultSeo
        titleTemplate='%s &middot; Cellscope'
        defaultTitle='Cellscope'
        description='Cellscope by Biomage turns your single cell datasets into meaningful biology. It’s free for academic researchers, and you get world-class quality analytical insight: simple data upload, data integration for batch effect correction, beautiful publication-quality figures, and much more.'
        twitter={{
          site: '@BiomageLtd',
          cardType: 'summary',
        }}
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Biomage Cellscope',
        }}
      />
      {mainContent(Component, pageProps)}
    </>
  );
};

WrappedApp.propTypes = {
  Component: PropTypes.element.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(WrappedApp);
