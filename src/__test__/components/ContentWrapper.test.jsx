import { mount } from 'enzyme';

import Auth from '@aws-amplify/auth';
import { Menu } from 'antd';
import { Provider } from 'react-redux';
import React from 'react';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getBackendStatus } from '../../redux/selectors';
import ContentWrapper from '../../components/ContentWrapper';
import '__test__/test-utils/setupTests';

jest.mock('../../redux/selectors');

const { Item } = Menu;

const experimentId = '1234';

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

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => true),
  federatedSignIn: jest.fn(),
}));

jest.mock('../../utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn().mockReturnValue(() => { }),
}));

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
  projects: {
    meta: {
      activeProjectUuid: '1234',
    },
  },
  backendStatus: {},
});

describe('ContentWrapper', () => {
  it('renders correctly', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: {},
    }));

    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper routeExperimentId={experimentId} experimentData={{ experimentName: 'test experiment' }}>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    wrapper.update();

    let sider;
    act(() => {
      sider = wrapper.find('Sider');
    });
    wrapper.update();

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

    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper>
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

  it('Links are enabled if the selected project is processed', async () => {
    // The selector gets called on each render, so we must make sure the same object
    // is returned each time.
    const mockBackendStatus = {
      loading: false,
      error: false,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
          paramsHash: false,
        },
      },
    };

    getBackendStatus.mockImplementation(() => () => mockBackendStatus);

    const wrapper = await mount(
      <Provider store={store}>
        <ContentWrapper>
          <></>
        </ContentWrapper>
      </Provider>,
    );

    // Run two cycles of updates so "should gem2s rerun" information
    // can propagate to the render. This should be refactored into a
    // react-testing-library test when possible.
    await wrapper.update();
    await wrapper.update();

    const sider = wrapper.find('Sider');

    expect(sider.length).toEqual(1);
    const menus = wrapper.find(Menu).children().find(Item);
    const visibleMenuLength = menus.length / 2;

    expect(visibleMenuLength).toEqual(4);
    for (let i = 0; i < visibleMenuLength; i += 1) {
      expect(menus.at(i).props().disabled).toEqual(false);
    }
    expect(menus.at(0).text()).toEqual('Data Management');
    expect(menus.at(1).text()).toEqual('Data Processing');
    expect(menus.at(2).text()).toEqual('Data Exploration');
    expect(menus.at(3).text()).toEqual('Plots and Tables');
  });

  it('has the correct sider and layout style when opened / closed', async () => {
    const siderHasWidth = (expectedWidth) => {
      const sider = wrapper.find('Sider');
      const expandedComputedStyle = getComputedStyle(sider.getDOMNode()).getPropertyValue('width');
      expect(expandedComputedStyle).toEqual(expectedWidth);

      const layout = wrapper.find('Layout Layout');
      expect(layout.prop('style')).toEqual(expect.objectContaining({ marginLeft: expectedWidth }));
    };

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
    wrapper.update();

    const expandedWidth = '210px';
    const collapsedWidth = '80px';

    // When the side bar is collapsed
    act(() => {
      wrapper.find('Sider').props().onCollapse(true);
    });
    wrapper.update();
    siderHasWidth(collapsedWidth);

    // When side bar is not collapsed
    act(() => {
      wrapper.find('Sider').props().onCollapse(false);
    });
    wrapper.update();
    siderHasWidth(expandedWidth);
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
      projects: {
        meta: {
          activeProjectUuid: '1234',
        },
      },
      experiments: { [experimentId]: {} },
    });

    // eslint-disable-next-line require-await
    const wrapper = await mount(
      <Provider store={testStore}>
        <ContentWrapper
          routeExperimentId={info.experimentId}
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
        <ContentWrapper routeExperimentId={experimentId}>
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
