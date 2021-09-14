import React, { useContext, useState } from 'react';
import propTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';

import ChangesNotAppliedModal from '../components/ChangesNotAppliedModal';

import { discardChangedQCFilters } from '../redux/actions/experimentSettings';
import { runPipeline } from '../redux/actions/pipeline';

const AppRouterContext = React.createContext(null);

const defaultRoute = 'data-management';

const AppRouteProvider = (props) => {
  const { children, experimentId } = props;
  const router = useRouter();

  // Check logic
  const [destinationRoute, setDestinationRoute] = useState(defaultRoute);
  const dispatch = useDispatch();
  const [showChangesNotAppliedModal, setShowChangesNotAppliedModal] = useState(false);

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  // Handle changes here
  const handleRouteChange = (previousRoute, nextRoute) => {
    // If there are unconfirmed changes, show modal
    if (changedQCFilters.size && previousRoute.match('/data-processing')) {
      setDestinationRoute(nextRoute);
      setShowChangesNotAppliedModal(true);
      return;
    }

    router.push(nextRoute);
  };

  const renderRouteIntercepts = () => {
    if (showChangesNotAppliedModal) {
      return (
        <ChangesNotAppliedModal
          experimentId={experimentId}
          onRunPipeline={() => {
            if (!experimentId) return;
            dispatch(runPipeline(experimentId));
            router.push(destinationRoute);
          }}
          onDiscardChanges={() => {
            dispatch(discardChangedQCFilters());
            setShowChangesNotAppliedModal(false);
          }}
          onCloseModal={() => {
            setShowChangesNotAppliedModal(false);
          }}
        />
      );
    }
  };

  const navigateTo = (nextRoute) => handleRouteChange(router.pathname, nextRoute);

  const contextObject = {
    navigateTo,
  };

  return (
    <AppRouterContext.Provider value={contextObject}>
      {renderRouteIntercepts()}
      {showChangesNotAppliedModal && (
        <ChangesNotAppliedModal
          experimentId={experimentId}
          onRunPipeline={() => {
            if (!experimentId) return;
            dispatch(runPipeline(experimentId));
            router.push(destinationRoute);
          }}
          onDiscardChanges={() => {
            dispatch(discardChangedQCFilters());
            setShowChangesNotAppliedModal(false);
          }}
          onCloseModal={() => {
            setShowChangesNotAppliedModal(false);
          }}
        />
      )}
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
