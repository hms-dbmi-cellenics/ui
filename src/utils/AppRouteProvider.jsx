import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

import DataProcessingIntercept from 'components/data-processing/DataProcessingIntercept';
import DataManagementIntercept from 'components/data-management/DataManagementIntercept';

const AppRouterContext = React.createContext(null);

const AppRouteProvider = (props) => {
  const { children } = props;
  const router = useRouter();

  const [renderIntercept, setRenderIntercept] = useState(null);

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );
  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);
  const experimentId = useSelector((state) => state.projects[activeProjectUuid]?.experiments[0]);
  const experiment = useSelector((state) => state.experiments[experimentId]);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const samples = useSelector((state) => state.samples);
  const gem2sBackendStatus = useSelector((state) => (
    state.backendStatus[experimentId]?.status?.gem2s));
  let rerunStatus;

  const availableIntercepts = {
    DATA_PROCESSING: (nextRoute, hardNavigate) => (
      <DataProcessingIntercept
        onContinueNavigation={() => continueNavigation(nextRoute, hardNavigate)}
        onDismissIntercept={() => setRenderIntercept(null)}
      />
    ),
    DATA_MANAGEMENT: (nextRoute, hardNavigate) => (
      <DataManagementIntercept
        onContinueNavigation={() => continueNavigation(nextRoute, hardNavigate)}
        onDismissIntercept={() => setRenderIntercept(null)}
        rerunStatus={rerunStatus}
        experimentId={experimentId}
      />
    ),
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
      rerunStatus = calculateGem2sRerunStatus(
        gem2sBackendStatus, activeProject, samples, experiment,
      );
      if (rerunStatus.rerun) {
        setRenderIntercept(availableIntercepts.DATA_MANAGEMENT(nextRoute, hardNavigate));
        return;
      }
    }
    continueNavigation(nextRoute, hardNavigate);
  };

  const navigateTo = (
    nextRoute,
    refreshPage,
  ) => handleRouteChange(router.pathname, nextRoute, refreshPage);

  return (
    <AppRouterContext.Provider value={navigateTo}>
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
