/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DefaultSeo } from 'next-seo';
import PropTypes from 'prop-types';
import Router, { useRouter } from 'next/router';
import NProgress from 'nprogress';
import Amplify from 'aws-amplify';
import _ from 'lodash';
import ContentWrapper from '../components/ContentWrapper';
import NotFoundPage from './404';
import Error from './_error';
import { wrapper } from '../redux/store';
import '../../assets/self-styles.less';
import '../../assets/nprogress.css';
import configure from '../utils/amplify-config';

// import { isBrowser } from '../utils/environment';
// TODO: this needs to be refactored after auth works properly
//
// import { isBrowser, getCurrentEnvironment } from '../utils/environment';
// import setupAmplify from '../utils/setupAmplify';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const WrappedApp = ({ Component, pageProps }) => {
  const { experimentId, experimentData } = pageProps;
  const router = useRouter();

  console.log(experimentData);

  const { auth: { userPoolId, identityPoolid } } = useSelector((state) => state.networkResources);

  useEffect(() => {
    Amplify.configure({
      ...configure(userPoolId, identityPoolid),
      ssr: true,
    });
  }, [userPoolId, identityPoolid]);

  // TODO: FIX THIS
  const experimentError = null;

  const mainContent = () => {
    // If this is a not found error, show it without the navigation bar.
    if (Component === NotFoundPage) {
      return <Component {...pageProps} />;
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

WrappedApp.getInitialProps = async ({ Component, ctx }) => {
  const { store, req, query } = ctx;

  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  const promises = [];

  if (req) {
    if (query?.experimentId) {
      const { default: getExperimentInfo } = require('../utils/ssr/getExperimentInfo');
      promises.push(getExperimentInfo);
    }

    const { default: getAuthenticationInfo } = require('../utils/ssr/getAuthenticationInfo');
    promises.push(getAuthenticationInfo);
  }

  let results = await Promise.all(promises.map((f) => f(ctx, store)));
  results = _.merge(...results);

  return { pageProps: { ...pageProps, ...results } };
};

WrappedApp.propTypes = {
  Component: PropTypes.element.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(WrappedApp);
