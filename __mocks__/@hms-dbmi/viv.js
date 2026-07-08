// Minimal viv stubs for jsdom tests. The real layers need WebGL; tests only need
// the imports to resolve (BitmaskLayer extends XRLayer; SpatialViewer constructs
// MultiscaleImageLayer and reads getDefaultInitialViewState).
class StubLayer {
  constructor(props) {
    this.props = props;
  }

  // lifecycle methods invoked via super.* by subclasses — no-ops in tests
  // eslint-disable-next-line class-methods-use-this
  updateState() {}

  // eslint-disable-next-line class-methods-use-this
  finalizeState() {}

  // eslint-disable-next-line class-methods-use-this
  draw() {}
}
StubLayer.defaultProps = {};

class XRLayer extends StubLayer {}
class MultiscaleImageLayer extends StubLayer {}

module.exports = {
  ZarrPixelSource: jest.fn(),
  XRLayer,
  MultiscaleImageLayer,
  getDefaultInitialViewState: jest.fn(() => ({ target: [0, 0, 0], zoom: 0 })),
};
