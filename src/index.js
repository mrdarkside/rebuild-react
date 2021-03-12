import React, { useState } from "./lib/react";

function Counter() {
  const [state, setState] = useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
}
const element = <Counter />;
const container = document.getElementById("root");
React.render(element, container);

// console.log("webpack");
