import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import { Menu } from 'antd';
import { Auth } from 'aws-amplify';

import { getBackendStatus } from '../../redux/selectors';

import ContentWrapper from '../../components/ContentWrapper';

jest.mock('../../redux/selectors');

const { Item } = Menu;

const experimentId = '1234';

jest.mock('localforage');
jest.mock('next/router', () => ({
  useRouter: jest.fn()
    .mockImplementationOnce(() => ({ // test 1
      query: {
        experimentId: '1234',
      },
    }))
    .mockImplementationOnce(() => ({ // test 2
      query: {
        experimentId: '1234',
      },
    }))
    .mockImplementationOnce(() => ({ // test 3
      query: {},
    })),

}));

jest.mock('aws-amplify', () => ({
  Auth: {
    currentAuthenticatedUser: jest.fn().mockImplementation(async () => true),
    federatedSignIn: jest.fn().mockImplementation(() => console.log('== HELLO ==')),
  },
}));

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  notifications: {},
  experimentSettings: {
    processing: {
      meta: {
        changedQCFilters: new Set(),
      },
    },
    info: {
      experimentId,
      experimentName: 'test experiment',
    },
  },
  experiments: { [experimentId]: {} },
});

describe('ContentWrapper', () => {
  it('renders correctly', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: {},
    }));

    // eslint-disable-next-line require-await
    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper experimentId>
          <></>
        </ContentWrapper>
      </Provider>,
    );

    await wrapper.update();

    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);

    // Menu item renders twice to support HOC usage (?)
    // https://ant.design/components/menu/#Why-Menu-children-node-will-render-twice
    const visibleMenuLength = menus.length / 2;

    expect(visibleMenuLength).toEqual(4);

    expect(menus.at(0).prop('id')).toEqual('/data-management');

    expect(menus.at(1).prop('id')).toEqual('/experiments/[experimentId]/data-processing');

    expect(menus.at(2).prop('id')).toEqual('/experiments/[experimentId]/data-exploration');

    expect(menus.at(3).prop('id')).toEqual('/experiments/[experimentId]/plots-and-tables');
  });

  it('links are disabled if there is no experimentId', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: null,
    }));

    // eslint-disable-next-line require-await
    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper backendStatus={{}}>
          <></>
        </ContentWrapper>
      </Provider>,
    );

    await wrapper.update();

    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);

    // Menu item renders twice to support HOC usage (?)
    // https://ant.design/components/menu/#Why-Menu-children-node-will-render-twice
    const visibleMenuLength = menus.length / 2;

    expect(visibleMenuLength).toEqual(4);

    // Data Management is not disabled
    expect(menus.at(0).props().disabled).toEqual(false);

    // Data Processing link is disabled
    expect(menus.at(1).props().disabled).toEqual(true);

    // Data Exploration link is disabled
    expect(menus.at(2).props().disabled).toEqual(true);

    // Plots and Tables link is disabled
    expect(menus.at(3).props().disabled).toEqual(true);
  });

  it('View changes if there is a pipeline run underway', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: { pipeline: { status: 'RUNNING' } },
    }));

    const info = {
      experimentId,
      experimentName: 'test experiment',
    };

    const testStore = mockStore({
      notifications: {},
      experimentSettings: {
        processing: {
          meta: {
            changedQCFilters: new Set(),
          },
        },
        info,
      },
      experiments: { [experimentId]: {} },
    });

    // eslint-disable-next-line require-await
    const wrapper = await mount(
      <Provider store={testStore}>
        <ContentWrapper
          experimentId={info.experimentId}
          experimentData={info}
        >
          <></>
        </ContentWrapper>
      </Provider>,
    );
    await wrapper.update();

    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);

    // Menu item renders twice to support HOC usage (?)
    // https://ant.design/components/menu/#Why-Menu-children-node-will-render-twice
    const visibleMenuLength = menus.length / 2;

    expect(visibleMenuLength).toEqual(4);

    const pipelineRedirects = wrapper.find('PipelineRedirectToDataProcessing');
    expect(pipelineRedirects.length).toEqual(1);
  });

  it('Redirects to login if the user is unauthenticated', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      [experimentId]: {
        loading: false,
        error: false,
        status: {},
      },
    }));

    Auth.currentAuthenticatedUser
      .mockImplementationOnce(
        async () => { throw new Error('user not signed in'); },
      );

    // eslint-disable-next-line require-await
    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper experimentId>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    await wrapper.update();

    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(0);

    const menu = wrapper.find(Menu);
    expect(menu.length).toEqual(0);

    expect(Auth.federatedSignIn).toHaveBeenCalled();
  });
});
