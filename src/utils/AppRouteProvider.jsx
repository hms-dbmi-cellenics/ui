import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';

import moment from 'moment';
import { updateExperimentInfo } from 'redux/actions/experimentSettings';
import { updateProject } from 'redux/actions/projects';
import { updateExperiment } from 'redux/actions/experiments';

import DataProcessingIntercept from 'components/data-processing/DataProcessingIntercept';

const AppRouterContext = React.createContext(null);

const AppRouteProvider = (props) => {
  const { children } = props;
  const router = useRouter();
  const dispatch = useDispatch();

  const [renderIntercept, setRenderIntercept] = useState(null);

  const activeProjectUuid = useSelector((state) => state?.projects?.meta?.activeProjectUuid);
  const experimentId = useSelector((state) => (
    state?.projects[activeProjectUuid]?.experiments[0]));
  const experiments = useSelector((state) => state.experiments);

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

  const updateExperimentInfoOnNavigate = () => {
    const lastViewed = moment().toISOString();

    dispatch(updateExperiment(experimentId, { lastViewed }));
    dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));
    dispatch(updateExperimentInfo({
      experimentId,
      experimentName: experiments[experimentId].name,
      sampleIds: experiments[experimentId].sampleIds,
    }));
  };

  const continueNavigation = (nextRoute, hardNavigate) => {
    // Hard navigate, causing the page to refresh and fetch data from server
    if (hardNavigate) window.location.href = nextRoute;
    router.push(nextRoute);
  };

  const handleRouteChange = (previousRoute, nextRoute, hardNavigate = false) => {
    if (previousRoute.match('/data-processing') && changedQCFilters.size > 0) {
      setRenderIntercept(availableIntercepts.DATA_PROCESSING(nextRoute, hardNavigate));
      return;
    }

    if (previousRoute.match('/data-management')) {
      // Update active project and experiment id when navigating from Data Management
      updateExperimentInfoOnNavigate();
    }

    continueNavigation(nextRoute, hardNavigate);
  };

  const navigateTo = (
    nextRoute,
    refreshPage,
  ) => handleRouteChange(router.pathname, nextRoute, refreshPage);

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
