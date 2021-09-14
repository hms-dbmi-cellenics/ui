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
    if (changedQCFilters.size && previousRoute === 'data-processing') {
      setDestinationRoute(nextRoute);
      setShowChangesNotAppliedModal(true);
    }
  };

  const navigateTo = (nextRoute) => handleRouteChange(router.path, nextRoute);

  const contextObject = {
    navigateTo,
  };

  return (
    <AppRouterContext.Provider value={contextObject}>
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
