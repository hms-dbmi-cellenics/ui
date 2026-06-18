import React from 'react';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import SpatialOutlierFilterPlot from 'components/plots/SpatialOutlierFilterPlot';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

// Heavy rendering deps are irrelevant to the URL-fetch logic under test.
jest.mock('react-vega', () => ({ Vega: () => null }));
jest.mock('vega-webgl-renderer', () => ({}), { virtual: true });

jest.mock('components/plots/useSpatialStream', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    imageDims: null,
    segmentationsAvailable: false,
    segProbeDone: true,
    tissueImageData: null,
    segOverlayData: null,
    onViewportChange: jest.fn(),
    ready: false,
  })),
}));

jest.mock('components/plots/usePreventWheelScroll', () => ({
  __esModule: true,
  default: () => ({ current: null }),
}));

const mockStore = configureMockStore([thunk]);

const experimentId = 'exp-1';
const sampleId = 'xenium-sample';

const config = {
  dimensions: { width: 100, height: 100 },
  colour: { gradient: 'default', toggleInvert: '#FFFFFF', masterColour: '#000000' },
  marker: { opacity: 10, outline: false },
  legend: { enabled: true },
};

const renderPlot = async (technology) => {
  const store = mockStore({
    samples: { [sampleId]: { id: sampleId, type: technology } },
  });

  await act(async () => {
    render(
      <Provider store={store}>
        <SpatialOutlierFilterPlot
          experimentId={experimentId}
          sampleId={sampleId}
          config={config}
          plotData={null}
        />
      </Provider>,
    );
  });
};

describe('SpatialOutlierFilterPlot — imageless technology (e.g. Xenium)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSampleFileUrls.mockResolvedValue([{ url: 'http://example.com/seg.zarr.zip' }]);
  });

  it('skips the tissue-image (ome_zarr_zip) fetch for an imageless tech', async () => {
    await renderPlot('xenium');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).not.toContain('ome_zarr_zip');
  });

  it('still probes the segmentation OME-Zarr', async () => {
    await renderPlot('xenium');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).toContain('segmentations_ome_zarr_zip');
  });

  it('does fetch the tissue image for a non-imageless spatial tech (visium_hd)', async () => {
    await renderPlot('visium_hd');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).toContain('ome_zarr_zip');
  });
});
