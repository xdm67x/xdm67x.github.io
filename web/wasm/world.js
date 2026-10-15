// The renderer's module entry point.
//
// Trunk compiles renderer/ to WebAssembly and emits the wasm-bindgen glue as
// /xdm67x-world.js (named after the Cargo package). The front end imports this
// stable path instead, so renaming the crate cannot break the app.
//
// `main.js` imports `{ World }` (the class) and the default export (`init`,
// which instantiates the module).
export * from "../xdm67x-world.js";
export { default } from "../xdm67x-world.js";
