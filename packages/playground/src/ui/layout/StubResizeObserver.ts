/* global jest -- the stub is for the specs that render the regions, and only they load it */
/**
 * Gives the window the `ResizeObserver` that `react-resizable-panels` needs and jsdom lacks. The stub observes nothing: jsdom has no layout, so the panels have no size to follow, and the tests do not need one. A test that renders the regions calls it before rendering.
 */
export function stubResizeObserver(): void {
  window.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as typeof ResizeObserver;
}
