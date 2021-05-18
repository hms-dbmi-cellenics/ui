/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DefaultSeo } from 'next-seo';
import PropTypes from 'prop-types';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress';
import Amplify, { Storage, withSSRContext } from 'aws-amplify';
import _ from 'lodash';
import AWS from 'aws-sdk';
import { Credentials } from '@aws-amplify/core';
import ContentWrapper from '../components/ContentWrapper';
import NotFoundPage from './404';
import Error from './_error';
import { wrapper } from '../redux/store';
import '../../assets/self-styles.less';
import '../../assets/nprogress.css';
import CustomError from '../utils/customError';

const mockCredentialsForInframock = () => {
  Credentials.get = async () => (
    new AWS.Credentials({
      accessKeyId: 'asd',
      secretAccessKey: 'asfdsa',
    })
  );

  Credentials.shear = () => (
    new AWS.Credentials({
      accessKeyId: 'asd',
      secretAccessKey: 'asfdsa',
    })
  );
};

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

Amplify.configure({
  ssr: true,
});

// Configure Amplify to not use prefix when uploading to public folder, instead of '/'
Storage.configure({
  customPrefix: {
    public: '',
  },
});

const WrappedApp = ({ Component, pageProps }) => {
  console.log(`WrappedApp.1 ${Component}`);
  console.log(`WrappedApp.2 ${JSON.stringify(pageProps, null, 2)}`);
  const { httpError, amplifyConfig } = pageProps;
  const router = useRouter();

  const { experimentId } = router.query;
  const experimentData = useSelector(
    (state) => (experimentId ? state.experimentSettings.info : {}),
  );

  const [amplifyConfigured, setAmplifyConfigured] = useState(false);

  const environment = useSelector((state) => state.networkResources.environment);

  useEffect(() => {
    console.log(`Configuring amplify with ${amplifyConfig}`);
    Amplify.configure(amplifyConfig);

    if (environment === 'development') {
      mockCredentialsForInframock();
    }

    setAmplifyConfigured(true);
  }, [amplifyConfig]);

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
          <NotFoundPage
            title='Analysis not found'
            subTitle={'You don\'t have access to this analysis.'}
            hint='You may be able to view it by logging in.'
          />
        );
      }

      return <Error statusCode={httpError} />;
    }

    if (!amplifyConfigured) {
      return <></>;
    }

    // Otherwise, load the page inside the content wrapper.
    return (
      <ContentWrapper
        experimentId={experimentId}
        experimentData={experimentData}
      >
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

/* eslint-disable global-require */
WrappedApp.getInitialProps = async ({ Component, ctx }) => {
  const {
    store, req, query, res,
  } = ctx;

  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  const promises = [];

  if (req) {
    const { default: getEnvironmentInfo } = require('../utils/ssr/getEnvironmentInfo');
    promises.push(getEnvironmentInfo);

    const { default: getAuthenticationInfo } = require('../utils/ssr/getAuthenticationInfo');
    promises.push(getAuthenticationInfo);
  }

  try {
    let results = await Promise.all(promises.map((f) => f(ctx, store)));
    console.log(`Results form promises in getInitialProps ${JSON.stringify(results, null, 2)}`);
    results = _.merge(...results);

    const { Auth } = withSSRContext(ctx);
    console.log(`Auth from withSSRContext: ${JSON.stringify(Auth, null, 2)}`);
    Auth.configure(results.amplifyConfig.Auth);

    if (req && query?.experimentId) {
      const { default: getExperimentInfo } = require('../utils/ssr/getExperimentInfo');

      const experimentInfo = await getExperimentInfo(ctx, store, Auth);
      console.log(`ExperimentInfo: ${experimentInfo}`);
      results = _.merge(results, experimentInfo);
    }

    return { pageProps: { ...pageProps, ...results } };
  } catch (e) {
    console.log('Error raised in getInitialProps.1');
    console.error(e);
    console.log('Error raised in getInitialProps.2');
    if (e instanceof CustomError) {
      if (res && e.payload.status) {
        res.statusCode = e.payload.status;
      } else {
        res.statusCode = 500;
      }

      return { pageProps: { ...pageProps, httpError: e.payload.status || true } };
    }

    throw e;
  }
};
/* eslint-enable global-require */

WrappedApp.propTypes = {
  Component: PropTypes.func.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(WrappedApp);
