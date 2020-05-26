/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Embedding from './Embedding';

const mockStore = configureMockStore([]);

describe('Embedding', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const store = mockStore({
      cells: {
        data: {
          cella: [-13, 32],
          cellb: [6, 7],
          cellc: [43, 9],
          celld: [57, 3],
        },
      },
      cellSetsColor: {
        data: [
          {
            color: '#ff0000',
            cellIds: ['1', '2', '3'],
          },
        ],
      },
    });

    const component = mount(
      <Provider store={store}>
        <Embedding experimentID="1234" embeddingType="pca" />
      </Provider>,
    );


    debugger;
    expect(component.find('Embedding').length).toEqual(1);
  });
});
