// [x] Step I: The createElement Function
// [x] Step II: The render Function
// [x] Step III: Concurrent Mode
// [ ] Step IV: Fibers
// [ ] Step V: Render and Commit Phases
// [ ] Step VI: Reconciliation
// [ ] Step VII: Function Components
// [ ] Step VIII: Hooks

// Use this comment with "@" before "jsx" to let babel translate jsx
// using Didact's createElement function
/** @jsx Didact.createElement */

function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => render(child, dom));
  container.appendChild(dom);

  // Concurrent Mode
  // Breaking work into small units so browser can interrupt
  // rendering in case there is other work needs to be done
  let nextUnitOfWork = null;

  function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = perfomUnitOfWork(nextUnitOfWork);

      // requestIdleCallback gives a deadline parameter to check how much time
      // we have until the browser needs to take control
      shouldYield = deadline.timeRemaining < 1;
    }
    // Browser will run the callback when the main thread is idle
    // React doesn’t use requestIdleCallback anymore — now it uses the scheduler package.
    requestIdleCallback(workloop);
  }

  requestIdleCallback(workLoop);

  function perfomUnitOfWork(nextUnitOfWork) {
    //
  }
}

const Didact = {
  createElement: createElement,
  render: render,
};

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

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
