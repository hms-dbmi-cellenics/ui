import '../../assets/self-styles.less';
import '../../assets/nprogress.css';

import Amplify, { Credentials } from '@aws-amplify/core';
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { DefaultSeo } from 'next-seo';
import { ErrorBoundary } from 'react-error-boundary';

import { wrapper } from 'redux/store';
import { useSelector, useStore } from 'react-redux';

import AppRouteProvider from 'utils/AppRouteProvider';
import ContentWrapper from 'components/ContentWrapper';
import TagManager from 'components/TagManager';
import { initTracking } from 'utils/tracking';

import CustomError from 'utils/customError';
import UnauthorizedPage from 'pages/401';
import NotFoundPage from 'pages/404';
import Error from 'pages/_error';
import postErrorToSlack from 'utils/postErrorToSlack';

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
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

Amplify.configure({
  ssr: true,
});

const WrappedApp = ({ Component, pageProps }) => {
  const { httpError, amplifyConfig } = pageProps;
  const router = useRouter();
  const { experimentId } = router.query;
  const experimentData = useSelector(
    (state) => (experimentId ? state.experimentSettings.info : {}),
  );
  const store = useStore();

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
      <ErrorBoundary
        FallbackComponent={Error}
        onError={(error, info) => {
          // Only log errors to Slack if in production.
          if (process.env.NODE_ENV !== 'production') return;
          const reduxDump = store.getState();
          postErrorToSlack(error, info, reduxDump);
        }}
      >
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
      </ErrorBoundary>
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
    store, req, query, res,
  } = ctx;

  // Do nothing if not server-side
  if (!req) { return { pageProps: {} }; }

  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  const promises = [];

  const { default: getEnvironmentInfo } = (await import('../utils/ssr/getEnvironmentInfo'));
  promises.push(getEnvironmentInfo);

  const { default: getAuthenticationInfo } = (await import('../utils/ssr/getAuthenticationInfo'));
  promises.push(getAuthenticationInfo);

  let results = await Promise.all(promises.map((f) => f(ctx, store)));
  results = _.merge(...results);

  try {
    const { withSSRContext } = (await import('aws-amplify'));

    const { Auth } = withSSRContext(ctx);
    Auth.configure(results.amplifyConfig.Auth);

    if (query?.experimentId) {
      const { default: getExperimentInfo } = (await import('../utils/ssr/getExperimentInfo'));
      const experimentInfo = await getExperimentInfo(ctx, store, Auth);
      results = _.merge(results, experimentInfo);
    }

    return { pageProps: { ...pageProps, ...results } };
  } catch (e) {
    if (e === 'The user is not authenticated') {
      console.error(`User not authenticated ${req.url}`);
      // eslint-disable-next-line no-ex-assign
      e = new CustomError(e, res);
      e.payload.status = 401;
    }
    if (e instanceof CustomError) {
      if (res && e.payload.status) {
        res.statusCode = e.payload.status;
      } else {
        res.statusCode = 500;
      }

      return { pageProps: { ...pageProps, ...results, httpError: e.payload.status || true } };
    }
    console.error('Error in WrappedApp.getInitialProps', e);

    throw e;
  }
};
/* eslint-enable global-require */

WrappedApp.propTypes = {
  Component: PropTypes.func.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(WrappedApp);
