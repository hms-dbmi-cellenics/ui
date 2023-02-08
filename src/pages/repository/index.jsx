import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadExperiments } from 'redux/actions/experiments';
import Header from 'components/Header';
import { privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';
import RepositoryTable from 'components/repository/RepositoryTable';

const RepositoryPage = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.current);

  const domainName = useSelector((state) => state.networkResources?.domainName);

  useEffect(() => {
    if (privacyPolicyIsNotAccepted(user, domainName)) return;
    dispatch(loadExperiments());
  }, [user]);

  return (
    <>
      <Header title='Data Management' />
      <RepositoryTable
        data={[
          {
            id: '123',
            name: 'My experiment',
            description: 'This is my experiment',
            publicationTitle: '10x Count',
            publicationUrl: 'https://www.google.com/',
            dataSourceTitle: 'This is my title',
            dataSourceUrl: 'https://www.google.com/',
            species: 'Human',
            sampleCount: '12',
            cellCount: '10000',
            technology: '10x',
          },
        ]}
      />
    </>
  );
};

export default RepositoryPage;
