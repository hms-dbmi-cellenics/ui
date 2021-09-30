import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import DataProcessingIntercept from '../components/data-processing/DataProcessingIntercept';

const AppRouterContext = React.createContext(null);

const AppRouteProvider = (props) => {
  const { children, experimentId } = props;
  const router = useRouter();

  const [displayIntercept, setDisplayIntercept] = useState(true);
  const [renderIntercept, setRenderIntercept] = useState(null);

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const cancelNavigation = () => {};

  const continueNavigation = (nextRoute, refreshPage) => {
    if (refreshPage) window.location.href = nextRoute;
    router.push(nextRoute);
  };

  const availableIntercepts = {
    DATA_PROCESSING: (nextRoute, refreshPage) => (
      <DataProcessingIntercept
        onContinueNavigation={() => continueNavigation(nextRoute, refreshPage)}
        onCancelNavigation={() => cancelNavigation()}
        onDismissIntercept={() => setDisplayIntercept(false)}
      />
    ),
  };

  const handleRouteChange = (previousRoute, nextRoute, refreshPage = false) => {
    if (previousRoute.match('/data-processing') && changedQCFilters.size > 0) {
      setDisplayIntercept(true);
      setRenderIntercept(availableIntercepts.DATA_PROCESSING(nextRoute, refreshPage));
      return;
    }

    // Hard navigate, cusing the page to refresh and fetch data from server
    if (refreshPage) window.location.href = nextRoute;

    router.push(nextRoute);
  };

  const navigateTo = (
    nextRoute,
    refreshPage,
  ) => handleRouteChange(router.pathname, nextRoute, refreshPage);

  const contextObject = {
    navigateTo,
  };

  return (
    <AppRouterContext.Provider value={contextObject}>
      {displayIntercept ? renderIntercept : <></>}
      {/* {renderRouteIntercepts()} */}
      {children}
    </AppRouterContext.Provider>
  );
};

AppRouteProvider.propTypes = {
  children: propTypes.node.isRequired,
  experimentId: propTypes.string,
};

AppRouteProvider.defaultProps = {
  experimentId: '',
};

const useAppRouter = () => useContext(AppRouterContext);

export {
  AppRouteProvider,
  useAppRouter,
};
