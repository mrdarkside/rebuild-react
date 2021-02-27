// Step I: The createElement Function
// Step II: The render Function
// Step III: Concurrent Mode
// Step IV: Fibers
// Step V: Render and Commit Phases
// Step VI: Reconciliation
// Step VII: Function Components
// Step VIII: Hooks

// Use this comment with "@" before "jsx" to let babel translate jsx
// using Didact's createElement function
/** jsx Didact.createElement */

const Didact = {
  createElement: createElement,
};

// Spread operator for children so it always be an array
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        //wrap primitives into own object with type TEXT_ELEMENT
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

// React doesn’t wrap primitive values or create empty arrays when there aren’t children
// just simplification
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
