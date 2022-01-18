import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { pathStubs } from 'utils/constants';

import moment from 'moment';
import { updateProject } from 'redux/actions/projects';
import { updateExperiment, switchExperiment } from 'redux/actions/experiments';

import DataProcessingIntercept from 'components/data-processing/DataProcessingIntercept';

/**
 * AppRouteProvider provides a context which allows for checking and interception
 * of navigation between parts of the application. This allows implemenation of middlewares
 * when navigating between pages.
 *
 * AppRouteProvider wraps the application and exposes `useAppRouter`, which returns
 * an object containing the function `navigateTo`. The function takes in the path to be
 * go to and performs matching and determine actions which have to be carried out before
 * navigating to the route.
 *
 * Use `navigateTo` when implementing navigation between pages. Do not use `router.push` directly
 * as it will bypass the route checks and middlewares.
 */

const AppRouterContext = React.createContext(null);

const AppRouteProvider = (props) => {
  const { children } = props;
  const router = useRouter();
  const dispatch = useDispatch();

  const [renderIntercept, setRenderIntercept] = useState(null);
  // const experiments = useSelector((state) => state.experiments);

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const availableIntercepts = {
    DATA_PROCESSING: (nextRoute, hardNavigate) => (
      <DataProcessingIntercept
        onContinueNavigation={() => continueNavigation(nextRoute, hardNavigate)}
        onDismissIntercept={() => setRenderIntercept(null)}
      />
    ),
  };

  const updateExperimentInfoOnNavigate = (projectUuid, experimentId) => {
    const lastViewed = moment().toISOString();

    dispatch(switchExperiment(experimentId));
    dispatch(updateExperiment(experimentId, { lastViewed }));
    dispatch(updateProject(projectUuid, { lastAnalyzed: lastViewed }));
  };

  const continueNavigation = (nextRoute, hardNavigate) => {
    // Hard navigate, causing the page to refresh and fetch data from server
    if (hardNavigate) window.location.href = nextRoute;
    router.push(nextRoute);
  };

  const handleRouteChange = (previousRoute, nextRoute, params, hardNavigate = false) => {
    console.warn('*** params', params);

    if (previousRoute.match(pathStubs.DATA_PROCESSING) && changedQCFilters.size > 0) {
      setRenderIntercept(availableIntercepts.DATA_PROCESSING(nextRoute, hardNavigate));
      return;
    }

    if (previousRoute.match(pathStubs.DATA_MANAGEMENT)) {
      // Update active project and experiment id when navigating from Data Management
      const { projectUuid, experimentId } = params;
      updateExperimentInfoOnNavigate(projectUuid, experimentId);
    }

    continueNavigation(nextRoute, hardNavigate);
  };

  const navigateTo = (
    nextRoute,
    params = {},
    refreshPage,
  ) => handleRouteChange(router.pathname, nextRoute, params, refreshPage);

  return (
    <AppRouterContext.Provider value={{ navigateTo }}>
      {renderIntercept ?? <></>}
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
