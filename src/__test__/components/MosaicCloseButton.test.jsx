import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import CloseButton from 'components/MosaicCloseButton';
import { MosaicContext, MosaicWindowContext } from 'react-mosaic-component';
import thunk from 'redux-thunk';

const mockStore = configureMockStore([thunk]);

describe('MosaicCloseButton tests', () => {
  let store;
  const mockMosaicActions = {
    remove: jest.fn(),
    getRoot: jest.fn(() => 'newStructure'),
  };
  const mockMosaicWindowActions = {
    getPath: jest.fn(() => 'mockPath'),
  };

  beforeEach(() => {
    store = mockStore({});
    jest.clearAllMocks();

    render(
      <Provider store={store}>
        <MosaicContext.Provider value={{ mosaicActions: mockMosaicActions }}>
          <MosaicWindowContext.Provider value={{ mosaicWindowActions: mockMosaicWindowActions }}>
            <CloseButton />
          </MosaicWindowContext.Provider>
        </MosaicContext.Provider>
      </Provider>,
    );
  });

  it('renders without crashing', () => {
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('removes the mosaic window and updates the layout when clicked', () => {
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    // Check if the remove function was called with the correct path
    expect(mockMosaicActions.remove).toHaveBeenCalledWith('mockPath');
  });
});
