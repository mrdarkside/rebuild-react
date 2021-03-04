// [x] Step I: The createElement Function
// [x] Step II: The render Function
// [x] Step III: Concurrent Mode
// [x] Step IV: Fibers
// [x] Step V: Render and Commit Phases
// [x] Step VI: Reconciliation
// [x] Step VII: Function Components
// [x] Step VIII: Hooks

// Spread operator for children so it always be an array
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        //wraps primitives into own object with type TEXT_ELEMENT
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

// React doesn’t wrap primitive values or create empty arrays
// when there aren’t children, just a simplification
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

// One special kind of prop that we need to update are event listeners
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // Compares the props from the old fiber to the props of the new fiber,
  // removes the props that are gone,
  // and sets the props that are new or changed.

  // If the event handler changed removes it from the node.
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // To find the parent of a DOM node we’ll need to go up the fiber tree
  // until we find a fiber with a DOM node.
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// Removing a node we also need to keep going until we find a child with a DOM node.
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // Link to the old fiber, the fiber committed to the DOM
    // in the previous commit phase
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null; // Reference to last fiber tree committed to the DOM
let wipRoot = null;
let deletions = null;

// Concurrent Mode
// Breaking work into small units so browser can interrupt
// rendering in case there is other work needs to be done
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    // requestIdleCallback gives a deadline parameter to check how much time
    // we have until the browser needs to take control
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // Browser will run the callback when the main thread is idle
  // React doesn’t use requestIdleCallback anymore — now it uses the scheduler package.
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Searching for the next unit of work
  // First try with the child, then with the sibling,
  // then with the uncle, and so on
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  // Adds a hooks array to the fiber to support calling useState
  // several times in the same component
  wipFiber.hooks = [];
  // Runs function to get the children
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  // If there is an old hook, copies the state from the old hook to the new hook,
  // if there is not initializes the state.
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    // For Counter example action is the function that increments the state by one
    hook.queue.push(action);
    // Set a new work in progress root as the next unit of work
    // so the work loop can start a new render phase
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // Add the new hook to the fiber, increment the hook index by one,
  // and return the state
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    // Root fiber has dom already???
    fiber.dom = createDom(fiber); // TO_GET #1
  }
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // To get if it's first child or not

  // Creates fiber for each child
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    // React also uses keys, that makes a better reconciliation.
    if (sameType) {
      // When the old fiber and the element have the same type, creates a new fiber
      // keeping the DOM node from the old fiber
      // and the props from the element
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      // If the element needs a new DOM node we tag the new fiber
      // with the PLACEMENT effect tag.
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      // For the case where we need to delete the node,
      // we don’t have a new fiber so we add the effect tag to the old fiber
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber; // Connecting siblings
    } // Adding to fiber tree as a child or a sibling

    prevSibling = newFiber;
    index++;
  }
}

const Didact = {
  createElement: createElement,
  render: render,
  useState,
};

// Use this comment with "@" before "jsx" to let babel translate jsx
// using Didact's createElement function

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
}
const element = <Counter />;
const container = document.getElementById("root");
Didact.render(element, container);
