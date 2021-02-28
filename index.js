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

<<<<<<< HEAD
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
}

const Didact = {
  createElement: createElement,
  render: render,
=======
const Didact = {
  createElement: createElement,
>>>>>>> ed1bf98b748adc83f250a2f741f999c0d9ab6c37
};

// Spread operator for children so it always be an array
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
<<<<<<< HEAD
      children: children.map((child) =>
=======
      children: children.map(child =>
>>>>>>> ed1bf98b748adc83f250a2f741f999c0d9ab6c37
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
<<<<<<< HEAD

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
=======
>>>>>>> ed1bf98b748adc83f250a2f741f999c0d9ab6c37
