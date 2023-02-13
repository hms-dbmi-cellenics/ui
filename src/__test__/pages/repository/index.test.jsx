import RepositoryPage from 'pages/repository';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import React from 'react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import { loadUser } from 'redux/actions/user';
import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { DomainName } from 'utils/deploymentInfo';

const RepositoryPageFactory = createTestComponentFactory(RepositoryPage);

const renderRepositoryPage = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {RepositoryPageFactory(store)}
      </Provider>,
    );
  });
};

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
    username: 'mockuser',
    attributes: {
      'custom:agreed_terms': 'false',
      email: 'mock@user.name',
      name: 'Mocked User',
    },
  })),
  federatedSignIn: jest.fn(),
}));

jest.mock('components/repository/RepositoryTable.jsx', () => {
  const RepositoryTable = () => <div>Hello, world!!! </div>;
  return RepositoryTable;
});

jest.mock('redux/actions/experiments');

enableFetchMocks();

describe('Repository page', () => {
  let store;

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses('1234-5678')));

    store = makeStore();
    await store.dispatch(loadUser());
    await store.dispatch(loadDeploymentInfo({ environment: 'production', domainName: DomainName.BIOMAGE }));
  });

  it('Does not render child component if terms are not accepted', async () => {
    await renderRepositoryPage(store);
  });
});
