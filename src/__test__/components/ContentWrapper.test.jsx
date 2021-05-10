import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import { Menu } from 'antd';
import ContentWrapper from '../../components/ContentWrapper';

const { Item } = Menu;

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

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  notifications: {},
  experimentSettings: {
    pipelineStatus: {
      loading: false,
      error: false,
      status: {},
    },
    info: {
      experimentId: '1234',
      experimentName: 'test experiment',
    },
  },
});

describe('ContentWrapper', () => {
  it('renders correctly', () => {
    const wrapper = mount(
      <Provider store={store}>
        <ContentWrapper experimentId='1234'>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);
    expect(menus.length).toEqual(4);

    const dataManagementLink = menus.at(0).find('Link');
    expect(dataManagementLink.props().as).toEqual('/data-management');

    const dataProcessingLink = menus.at(1).find('Link');
    expect(dataProcessingLink.props().as).toEqual('/experiments/1234/data-processing');

    const dataExplorationLink = menus.at(2).find('Link');
    expect(dataExplorationLink.props().as).toEqual('/experiments/1234/data-exploration');

    const plotsTablesLink = menus.at(3).find('Link');
    expect(plotsTablesLink.props().as).toEqual('/experiments/1234/plots-and-tables');
  });

  it('links are disabled if there is no experimentId', () => {
    const wrapper = mount(
      <Provider store={store}>
        <ContentWrapper backendStatus={{}}>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);
    expect(menus.length).toEqual(4);

    // Data Management is not disabled
    expect(menus.at(0).props().disabled).toEqual(false);

    // Data Processing link is disabled
    expect(menus.at(1).props().disabled).toEqual(true);

    // Data Exploration link is disabled
    expect(menus.at(2).props().disabled).toEqual(true);

    // Plots and Tables link is disabled
    expect(menus.at(3).props().disabled).toEqual(true);
  });

  test('View changes if there is a pipeline run underway', () => {
    const info = {
      experimentId: '1234',
      experimentName: 'test experiment',
    };

    const testStore = mockStore({
      notifications: {},
      experimentSettings: {
        pipelineStatus: {
          loading: false,
          error: false,
          status: { pipeline: { status: 'RUNNING' } },
        },
        info,
      },
    });

    const wrapper = mount(
      <Provider store={testStore}>
        <ContentWrapper
          experimentId={info.experimentId}
          experimentData={info}
        >
          <></>
        </ContentWrapper>
      </Provider>,
    );

    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);
    expect(menus.length).toEqual(4);

    const pipelineRedirects = wrapper.find('PipelineRedirectToDataProcessing');
    expect(pipelineRedirects.length).toEqual(1);
  });
});
