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
    .mockImplementationOnce(() => ({ // 1st test
      query: {
        experimentId: '1234',
      },
    }))
    .mockImplementationOnce(() => ({ // 2nd test
      query: {},
    })),
}));

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  notifications: {},
});

describe('ContentWrapper', () => {
  it('renders correctly', () => {
    const wrapper = mount(
      <Provider store={store}>
        <ContentWrapper>
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
        <ContentWrapper>
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
});
