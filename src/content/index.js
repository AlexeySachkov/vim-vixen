import '../console/console-frame.scss';
import * as clipboards from './clipboards';
import * as consoleFrames from '../console/frames';
import * as scrolls from '../content/scrolls';
import * as navigates from '../content/navigates';
import Follow from '../content/follow';
import operations from '../operations';
import messages from '../messages';

consoleFrames.initialize(window.document);

const startFollows = (newTab) => {
  let follow = new Follow(window.document, newTab);
  follow.onActivated((element) => {
    switch (element.tagName.toLowerCase()) {
    case 'a':
      return browser.runtime.sendMessage({
        type: messages.OPEN_URL,
        url: element.href,
        newTab
      });
    case 'input':
      switch (element.type) {
      case 'file':
      case 'checkbox':
      case 'radio':
      case 'submit':
      case 'reset':
      case 'button':
      case 'image':
      case 'color':
        return element.click();
      default:
        return element.focus();
      }
    case 'textarea':
      return element.focus();
    case 'button':
      return element.click();
    }
  });
};

window.addEventListener('keypress', (e) => {
  if (e.target instanceof HTMLInputElement) {
    return;
  }

  if (e.key === 'y') {
    clipboards.copyLocation(window.document);
  }

  browser.runtime.sendMessage({
    type: messages.KEYDOWN,
    code: e.which,
    ctrl: e.ctrlKey
  });
});

const execOperation = (operation) => {
  switch (operation.type) {
  case operations.SCROLL_LINES:
    return scrolls.scrollLines(window, operation.count);
  case operations.SCROLL_PAGES:
    return scrolls.scrollPages(window, operation.count);
  case operations.SCROLL_TOP:
    return scrolls.scrollTop(window);
  case operations.SCROLL_BOTTOM:
    return scrolls.scrollBottom(window);
  case operations.SCROLL_LEFT:
    return scrolls.scrollLeft(window);
  case operations.SCROLL_RIGHT:
    return scrolls.scrollRight(window);
  case operations.FOLLOW_START:
    return startFollows(operation.newTab);
  case operations.NAVIGATE_HISTORY_PREV:
    return navigates.historyPrev(window);
  case operations.NAVIGATE_HISTORY_NEXT:
    return navigates.historyNext(window);
  case operations.NAVIGATE_LINK_PREV:
    return navigates.linkPrev(window);
  case operations.NAVIGATE_LINK_NEXT:
    return navigates.linkNext(window);
  case operations.NAVIGATE_PARENT:
    return navigates.parent(window);
  case operations.NAVIGATE_ROOT:
    return navigates.root(window);
  }
};

const update = (state) => {
  if (!state.console.commandShown) {
    window.focus();
    consoleFrames.blur(window.document);
  }
};

browser.runtime.onMessage.addListener((action) => {
  switch (action.type) {
  case messages.STATE_UPDATE:
    return update(action.state);
  case messages.CONTENT_OPERATION:
    execOperation(action.operation);
    return Promise.resolve();
  default:
    return Promise.resolve();
  }
});

clipboards.init(window.document);
