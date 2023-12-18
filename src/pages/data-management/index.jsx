import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadExperiments } from 'redux/actions/experiments';

import Header from 'components/Header';
import MultiTileContainer from 'components/MultiTileContainer';
import NewProjectModal from 'components/data-management/NewProjectModal';
import ProjectsListContainer from 'components/data-management/project/ProjectsListContainer';
import ProjectDetails from 'components/data-management/project/ProjectDetails';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import { loadSamples } from 'redux/actions/samples';
import ExampleExperimentsSpace from 'components/data-management/ExampleExperimentsSpace';
import Loader from 'components/Loader';
import { privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';

const DataManagementPage = () => {
  const dispatch = useDispatch();

  const samples = useSelector((state) => state.samples);

  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const experiments = useSelector(((state) => state.experiments));
  const user = useSelector((state) => state.user.current);

  const activeExperiment = experiments[activeExperimentId];
  const domainName = useSelector((state) => state.networkResources?.domainName);

  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);

  useEffect(() => {
    if (privacyPolicyIsNotAccepted(user, domainName)) return;
    if (experiments.ids.length === 0) dispatch(loadExperiments());
  }, [user]);

  const samplesAreLoaded = () => {
    const loadedSampleIds = Object.keys(samples);
    return activeExperiment.sampleIds.every((sampleId) => loadedSampleIds.includes(sampleId));
  };

  useEffect(() => {
    // If the active experiment isnt loaded, reload
    if (activeExperimentId && !activeExperiment) {
      dispatch(loadExperiments());
    }
  }, [activeExperiment]);

  useEffect(() => {
    if (!activeExperimentId
      || !activeExperiment
       || privacyPolicyIsNotAccepted(user, domainName)
    ) return;

    dispatch(loadProcessingSettings(activeExperimentId));

    if (!samplesAreLoaded()) dispatch(loadSamples(activeExperimentId));

    dispatch(loadBackendStatus(activeExperimentId));
  }, [activeExperimentId, activeExperiment, user]);

  const PROJECTS_LIST = 'Projects';
  const PROJECT_DETAILS = 'Project Details';

  const TILE_MAP = {
    [PROJECTS_LIST]: {
      toolbarControls: [],
      component: (width, height) => (
        <ProjectsListContainer
          height={height}
          onCreateNewProject={() => setNewProjectModalVisible(true)}
        />
      ),
    },
    [PROJECT_DETAILS]: {
      toolbarControls: [],
      component: (width, height) => {
        if (!activeExperimentId) {
          return <ExampleExperimentsSpace introductionText='You have no projects yet.' />;
        }

        if (!activeExperiment) {
          return (
            <center>
              <Loader />
            </center>
          );
        }

        return (
          <ProjectDetails
            width={width}
            height={height}
          />
        );
      },
    },
  };

  const windows = {
    direction: 'row',
    first: PROJECTS_LIST,
    second: PROJECT_DETAILS,
    splitPercentage: 23,
  };

  return (
    <>
      <Header title='Data Management' />
      {newProjectModalVisible ? (
        <NewProjectModal
          onCancel={() => { setNewProjectModalVisible(false); }}
          onCreate={() => { setNewProjectModalVisible(false); }}
        />
      ) : (<></>)}
      <MultiTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

export default DataManagementPage;
