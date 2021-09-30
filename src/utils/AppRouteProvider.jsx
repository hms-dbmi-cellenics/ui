import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import DataProcessingIntercept from '../components/data-processing/DataProcessingIntercept';

const AppRouterContext = React.createContext(null);

const AppRouteProvider = (props) => {
  const { children } = props;
  const router = useRouter();

  const [displayIntercept, setDisplayIntercept] = useState(true);
  const [renderIntercept, setRenderIntercept] = useState(null);

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const availableIntercepts = {
    DATA_PROCESSING: (nextRoute, hardNavigate) => (
      <DataProcessingIntercept
        onContinueNavigation={() => continueNavigation(nextRoute, hardNavigate)}
        onCancelNavigation={() => cancelNavigation()}
        onDismissIntercept={() => setDisplayIntercept(false)}
      />
    ),
  };

  const cancelNavigation = () => {};

  const continueNavigation = (nextRoute, hardNavigate) => {
    // Hard navigate, cusing the page to refresh and fetch data from server
    if (hardNavigate) window.location.href = nextRoute;
    router.push(nextRoute);
  };

  const handleRouteChange = (previousRoute, nextRoute, hardNavigate = false) => {
    if (previousRoute.match('/data-processing') && changedQCFilters.size > 0) {
      setDisplayIntercept(true);
      setRenderIntercept(availableIntercepts.DATA_PROCESSING(nextRoute, hardNavigate));
      return;
    }

    continueNavigation(nextRoute, hardNavigate);
  };

  const navigateTo = (
    nextRoute,
    refreshPage,
  ) => handleRouteChange(router.pathname, nextRoute, refreshPage);

  return (
    <AppRouterContext.Provider value={navigateTo}>
      {displayIntercept ? renderIntercept : <></>}
      {children}
    </AppRouterContext.Provider>
  );
};

AppRouteProvider.propTypes = {
  children: propTypes.node.isRequired,
};

const useAppRouter = () => useContext(AppRouterContext);

export { useAppRouter };
export default AppRouteProvider;
