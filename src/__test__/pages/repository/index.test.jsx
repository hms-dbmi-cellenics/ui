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
import Auth from '@aws-amplify/auth';

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

jest.mock('@aws-amplify/auth', () => jest.fn());

jest.mock('components/repository/RepositoryTable.jsx', () => {
  const RepositoryTable = () => <div>Hello, world!!! </div>;
  return RepositoryTable;
});

enableFetchMocks();

describe('Repository page', () => {
  let store;

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses('1234-5678')));
    Auth.federatedSignIn = jest.fn(() => { });

    store = makeStore();
  });

  it('Does not render child component if terms are not accepted', async () => {
    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve(
      {
        username: 'mockuser',
        attributes: { name: 'Mocked User', 'custom:agreed_terms': 'false', email: 'mock@user.name' },
      },
    ));
    await store.dispatch(loadUser());
    await store.dispatch(loadDeploymentInfo({ environment: 'production', domainName: DomainName.BIOMAGE }));

    await renderRepositoryPage(store);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/v2/experiments/examples'),
    );
  });

  it('Renders child component if terms are accepted', async () => {
    Auth.currentAuthenticatedUser = jest.fn(() => Promise.resolve(
      {
        username: 'mockuser',
        attributes: { name: 'Mocked User', 'custom:agreed_terms': 'true', email: 'mock@user.name' },
      },
    ));
    await store.dispatch(loadUser());
    await store.dispatch(loadDeploymentInfo({ environment: 'production', domainName: DomainName.BIOMAGE }));

    await renderRepositoryPage(store);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/examples',
      {
        headers: {},
      },
    );
  });
});
