import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import SpatialVisibleLayersSettings from 'components/data-exploration/spatial/SpatialVisibleLayersSettings';
import { sampleTech } from 'utils/constants';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);
const componentType = 'interactiveSpatial';
const sampleId = 'sample-1';

const makeStore = (technology) => mockStore({
  componentConfig: {
    [componentType]: {
      config: {
        showImages: true,
        showSegmentations: true,
        showSegmentationOutlines: false,
      },
    },
  },
  experimentSettings: { info: { sampleIds: [sampleId] } },
  samples: { [sampleId]: { type: technology } },
});

const mountWith = (technology) => mount(
  <Provider store={makeStore(technology)}>
    <SpatialVisibleLayersSettings componentType={componentType} />
  </Provider>,
);

describe('SpatialVisibleLayersSettings', () => {
  it('shows the Images toggle for image-backed techs (Visium HD)', () => {
    const component = mountWith(sampleTech.VISIUM_HD);
    const text = component.text();
    expect(text).toContain('Images');
    expect(text).toContain('Segmentations');
    component.unmount();
  });

  it('hides the Images toggle for imageless techs (Xenium)', () => {
    const component = mountWith(sampleTech.XENIUM);
    const text = component.text();
    expect(text).not.toContain('Images');
    // the other layers are still offered
    expect(text).toContain('Segmentations');
    expect(text).toContain('Outlines');
    component.unmount();
  });
});
