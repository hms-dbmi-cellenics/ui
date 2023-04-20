import '../../assets/self-styles.less';
import '../../assets/nprogress.css';

import Amplify, { Credentials } from '@aws-amplify/core';
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import { DefaultSeo } from 'next-seo';

import { wrapper } from 'redux/store';
import { useSelector } from 'react-redux';

import AppRouteProvider from 'utils/AppRouteProvider';
import ContentWrapper from 'components/ContentWrapper';
import TagManager from 'components/TagManager';
import { initTracking } from 'utils/tracking';

import UnauthorizedPage from 'pages/401';
import NotFoundPage from 'pages/404';
import Error from 'pages/_error';
import APIError from 'utils/errors/http/APIError';

const mockCredentialsForInframock = () => {
  Credentials.get = async () => ({
    expired: false,
    expireTime: null,
    refreshCallbacks: [],
    accessKeyId: 'asd', // pragma: allowlist secret
    secretAccessKey: 'asfdsa', // pragma: allowlist secret
    sessionToken: 'asdfasdf', // pragma: allowlist secret
  });

  Credentials.shear = async () => ({
    expired: false,
    expireTime: null,
    refreshCallbacks: [],
    accessKeyId: 'asd', // pragma: allowlist secret
    secretAccessKey: 'asfdsa', // pragma: allowlist secret
    sessionToken: 'asdfasdf', // pragma: allowlist secret
  });
};

NProgress.configure({ showSpinner: false });

Amplify.configure({
  ssr: true,
});

const addDashesToExperimentId = (experimentId) => experimentId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

const WrappedApp = ({ Component, pageProps }) => {
  const { httpError, amplifyConfig } = pageProps;
  const router = useRouter();

  useEffect(() => {
    router.events.on('routeChangeStart', () => NProgress.start());
    router.events.on('routeChangeComplete', () => NProgress.done());
    router.events.on('routeChangeError', () => NProgress.done());
  }, [router]);

  const { experimentId: urlExperimentId } = router.query;

  // If the experimentId exists (we are not is data management) and
  // is the old version (without dashes), then add them
  const experimentId = !urlExperimentId || urlExperimentId.includes('-') ? urlExperimentId : addDashesToExperimentId(urlExperimentId);

  const experimentData = useSelector(
    (state) => (experimentId ? state.experimentSettings.info : {}),
  );

  const [amplifyConfigured, setAmplifyConfigured] = useState(!amplifyConfig);

  const environment = useSelector((state) => state.networkResources.environment);

  useEffect(() => {
    initTracking(environment);
  }, []);

  useEffect(() => {
    if (amplifyConfig) {
      Amplify.configure(amplifyConfig);

      if (environment === 'development') {
        mockCredentialsForInframock();
      }

      setAmplifyConfigured(true);
    }
  }, [amplifyConfig]);
  if (!amplifyConfigured) {
    return <></>;
  }

  const mainContent = () => {
    // If this is a not found error, show it without the navigation bar.
    if (Component === NotFoundPage) {
      return <Component {...pageProps} />;
    }

    // If there was an error querying the API, display an error state.
    if (httpError) {
      if (httpError === 404) {
        return (
          <NotFoundPage
            title={'Analysis doesn\'t exist'}
            subTitle={'We searched, but we couldn\'t find the analysis you\'re looking for.'}
            hint='It may have been deleted by the project owner. Go home to see your own projects and analyses.'
          />
        );
      }

      if (httpError === 403) {
        return (
          <NotFoundPage
            title='Analysis not found'
            subTitle={'You don\'t have access to this analysis. The owner may have made it private.'}
            hint='If somebody gave you this link, they may need to invite you to their project.'
          />
        );
      }

      if (httpError === 424) {
        return (
          <NotFoundPage
            title='Terms agreement required'
            subTitle='You cannot access your analysis in Cellenics until you have agreed to our updated privacy policy.'
            hint='Go to Data Management to accept the terms.'
            primaryActionText='Go to Data Management'
          />
        );
      }

      if (httpError === 401) {
        return (
          <UnauthorizedPage
            title='Log in to continue'
            subTitle="We can't show you this page."
            hint='You may be able to view it by logging in.'
          />
        );
      }

      return <Error statusCode={httpError} />;
    }

    // Otherwise, load the page inside the content wrapper.
    return (
      <AppRouteProvider>
        <ContentWrapper
          routeExperimentId={experimentId}
          experimentData={experimentData}
        >
          <Component
            experimentId={experimentId}
            experimentData={experimentData}
            {...pageProps}
          />
        </ContentWrapper>
      </AppRouteProvider>
    );
  };

  return (
    <>
      <DefaultSeo
        titleTemplate='%s &middot; Cellenics'
        defaultTitle='Cellenics'
        description='Cellenics turns your single cell datasets into meaningful biology. It’s free for academic researchers, and you get world-class quality analytical insight: simple data upload, data integration for batch effect correction, beautiful publication-quality figures, and much more.'
        twitter={{
          site: '@BiomageLtd',
          cardType: 'summary',
        }}
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Biomage Cellenics',
        }}
      />
      <TagManager
        environment={environment}
      />
      {mainContent(Component, pageProps)}
    </>
  );
};

/* eslint-disable global-require */
WrappedApp.getInitialProps = async ({ Component, ctx }) => {
  const {
    store, req, query, res, err,
  } = ctx;

  // If a render error occurs, NextJS bypasses the normal page rendering
  // and returns `_error.jsx` instead, returning these parameters
  if (err) { return { pageProps: { errorObject: err } }; }

  // Do nothing if not server-side
  if (!req) { return { pageProps: {} }; }

  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  const promises = [];

  const { default: getEnvironmentInfo } = (await import('utils/ssr/getEnvironmentInfo'));
  promises.push(getEnvironmentInfo);

  const { default: getAuthenticationInfo } = (await import('utils/ssr/getAuthenticationInfo'));
  promises.push(getAuthenticationInfo);

  const results = await Promise.all(promises.map((f) => f(ctx, store)));
  const { amplifyConfig } = results[1];

  try {
    const { withSSRContext } = (await import('aws-amplify'));

    const { Auth } = withSSRContext(ctx);
    Auth.configure(amplifyConfig.Auth);

    if (query?.experimentId) {
      const { default: getExperimentInfo } = (await import('utils/ssr/getExperimentInfo'));
      await getExperimentInfo(ctx, store, Auth);
    }

    return { pageProps: { ...pageProps, amplifyConfig } };
  } catch (e) {
    console.error(e);

    if (!(e instanceof APIError)) {
      // eslint-disable-next-line no-ex-assign
      e = new APIError(500);
    }
    res.statusCode = e.statusCode;

    return { pageProps: { ...pageProps, amplifyConfig, httpError: e.statusCode || true } };
  }
};
/* eslint-enable global-require */

WrappedApp.propTypes = {
  Component: PropTypes.func.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(WrappedApp);
