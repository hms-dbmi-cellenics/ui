import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadExampleExperiments } from 'redux/actions/experiments';
import Header from 'components/Header';
import { privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';
import RepositoryTable from 'components/repository/RepositoryTable';

const RepositoryPage = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.current);
  const domainName = useSelector((state) => state.networkResources?.domainName);
  const exampleExperiments = useSelector((state) => state.experiments.meta?.exampleExperiments);

  useEffect(() => {
    if (privacyPolicyIsNotAccepted(user, domainName)) return;
    dispatch(loadExampleExperiments());
  }, [user]);

  return (
    <>
      <Header title='Data Management' />
      <RepositoryTable
        data={exampleExperiments}
      />
    </>
  );
};

export default RepositoryPage;
