"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/confirmation";
exports.ids = ["pages/confirmation"];
exports.modules = {

/***/ "(pages-dir-node)/./components/Confirmation.jsx":
/*!*************************************!*\
  !*** ./components/Confirmation.jsx ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Confirmation)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"(pages-dir-node)/./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n// Confirmation.jsx\n\n\n\nfunction Confirmation() {\n    const [referralLink, setReferralLink] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"Confirmation.useEffect\": ()=>{\n            const userId = 'test_user'; // Replace with real user ID session management later\n            setReferralLink(`${window.location.origin}/?ref=${userId}`);\n        }\n    }[\"Confirmation.useEffect\"], []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        style: {\n            padding: '2rem',\n            textAlign: 'center'\n        },\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h1\", {\n                children: \"You Are Soulbound\"\n            }, void 0, false, {\n                fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                lineNumber: 16,\n                columnNumber: 13\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                children: \"Your oath has been recorded into eternity.\"\n            }, void 0, false, {\n                fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                lineNumber: 17,\n                columnNumber: 13\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                onClick: ()=>router.push('/soulprint'),\n                children: \"View Soulprint\"\n            }, void 0, false, {\n                fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                lineNumber: 18,\n                columnNumber: 13\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                style: {\n                    marginTop: '20px'\n                },\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                        children: \"Invite Souls:\"\n                    }, void 0, false, {\n                        fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                        lineNumber: 20,\n                        columnNumber: 17\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"input\", {\n                        value: referralLink,\n                        readOnly: true,\n                        style: {\n                            width: '300px'\n                        }\n                    }, void 0, false, {\n                        fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                        lineNumber: 21,\n                        columnNumber: 17\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                        onClick: ()=>navigator.clipboard.writeText(referralLink),\n                        children: \"Copy Link\"\n                    }, void 0, false, {\n                        fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                        lineNumber: 22,\n                        columnNumber: 17\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n                lineNumber: 19,\n                columnNumber: 13\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/components/Confirmation.jsx\",\n        lineNumber: 15,\n        columnNumber: 9\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL2NvbXBvbmVudHMvQ29uZmlybWF0aW9uLmpzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsbUJBQW1COztBQUN5QjtBQUNKO0FBRXpCLFNBQVNHO0lBQ3BCLE1BQU0sQ0FBQ0MsY0FBY0MsZ0JBQWdCLEdBQUdKLCtDQUFRQSxDQUFDO0lBQ2pELE1BQU1LLFNBQVNKLHNEQUFTQTtJQUV4QkYsZ0RBQVNBO2tDQUFDO1lBQ04sTUFBTU8sU0FBUyxhQUFhLHFEQUFxRDtZQUNqRkYsZ0JBQWdCLEdBQUdHLE9BQU9DLFFBQVEsQ0FBQ0MsTUFBTSxDQUFDLE1BQU0sRUFBRUgsUUFBUTtRQUM5RDtpQ0FBRyxFQUFFO0lBRUwscUJBQ0ksOERBQUNJO1FBQUlDLE9BQU87WUFBRUMsU0FBUztZQUFRQyxXQUFXO1FBQVM7OzBCQUMvQyw4REFBQ0M7MEJBQUc7Ozs7OzswQkFDSiw4REFBQ0M7MEJBQUU7Ozs7OzswQkFDSCw4REFBQ0M7Z0JBQU9DLFNBQVMsSUFBTVosT0FBT2EsSUFBSSxDQUFDOzBCQUFlOzs7Ozs7MEJBQ2xELDhEQUFDUjtnQkFBSUMsT0FBTztvQkFBRVEsV0FBVztnQkFBTzs7a0NBQzVCLDhEQUFDSjtrQ0FBRTs7Ozs7O2tDQUNILDhEQUFDSzt3QkFBTUMsT0FBT2xCO3dCQUFjbUIsUUFBUTt3QkFBQ1gsT0FBTzs0QkFBRVksT0FBTzt3QkFBUTs7Ozs7O2tDQUM3RCw4REFBQ1A7d0JBQU9DLFNBQVMsSUFBTU8sVUFBVUMsU0FBUyxDQUFDQyxTQUFTLENBQUN2QjtrQ0FBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSXBGIiwic291cmNlcyI6WyIvVXNlcnMvbWF0dGhld21hdWVyL0Rlc2t0b3AvU291bGZyYVdvcmtzcGFjZS9zb3VsZnJhLWRldi9jb21wb25lbnRzL0NvbmZpcm1hdGlvbi5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29uZmlybWF0aW9uLmpzeFxuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ29uZmlybWF0aW9uKCkge1xuICAgIGNvbnN0IFtyZWZlcnJhbExpbmssIHNldFJlZmVycmFsTGlua10gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjb25zdCB1c2VySWQgPSAndGVzdF91c2VyJzsgLy8gUmVwbGFjZSB3aXRoIHJlYWwgdXNlciBJRCBzZXNzaW9uIG1hbmFnZW1lbnQgbGF0ZXJcbiAgICAgICAgc2V0UmVmZXJyYWxMaW5rKGAke3dpbmRvdy5sb2NhdGlvbi5vcmlnaW59Lz9yZWY9JHt1c2VySWR9YCk7XG4gICAgfSwgW10pO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnMnJlbScsIHRleHRBbGlnbjogJ2NlbnRlcicgfX0+XG4gICAgICAgICAgICA8aDE+WW91IEFyZSBTb3VsYm91bmQ8L2gxPlxuICAgICAgICAgICAgPHA+WW91ciBvYXRoIGhhcyBiZWVuIHJlY29yZGVkIGludG8gZXRlcm5pdHkuPC9wPlxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiByb3V0ZXIucHVzaCgnL3NvdWxwcmludCcpfT5WaWV3IFNvdWxwcmludDwvYnV0dG9uPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBtYXJnaW5Ub3A6ICcyMHB4JyB9fT5cbiAgICAgICAgICAgICAgICA8cD5JbnZpdGUgU291bHM6PC9wPlxuICAgICAgICAgICAgICAgIDxpbnB1dCB2YWx1ZT17cmVmZXJyYWxMaW5rfSByZWFkT25seSBzdHlsZT17eyB3aWR0aDogJzMwMHB4JyB9fSAvPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVmZXJyYWxMaW5rKX0+Q29weSBMaW5rPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiJdLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsInVzZVJvdXRlciIsIkNvbmZpcm1hdGlvbiIsInJlZmVycmFsTGluayIsInNldFJlZmVycmFsTGluayIsInJvdXRlciIsInVzZXJJZCIsIndpbmRvdyIsImxvY2F0aW9uIiwib3JpZ2luIiwiZGl2Iiwic3R5bGUiLCJwYWRkaW5nIiwidGV4dEFsaWduIiwiaDEiLCJwIiwiYnV0dG9uIiwib25DbGljayIsInB1c2giLCJtYXJnaW5Ub3AiLCJpbnB1dCIsInZhbHVlIiwicmVhZE9ubHkiLCJ3aWR0aCIsIm5hdmlnYXRvciIsImNsaXBib2FyZCIsIndyaXRlVGV4dCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./components/Confirmation.jsx\n");

/***/ }),

/***/ "(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fconfirmation&preferredRegion=&absolutePagePath=.%2Fpages%2Fconfirmation.jsx&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fconfirmation&preferredRegion=&absolutePagePath=.%2Fpages%2Fconfirmation.jsx&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   getServerSideProps: () => (/* binding */ getServerSideProps),\n/* harmony export */   getStaticPaths: () => (/* binding */ getStaticPaths),\n/* harmony export */   getStaticProps: () => (/* binding */ getStaticProps),\n/* harmony export */   reportWebVitals: () => (/* binding */ reportWebVitals),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   unstable_getServerProps: () => (/* binding */ unstable_getServerProps),\n/* harmony export */   unstable_getServerSideProps: () => (/* binding */ unstable_getServerSideProps),\n/* harmony export */   unstable_getStaticParams: () => (/* binding */ unstable_getStaticParams),\n/* harmony export */   unstable_getStaticPaths: () => (/* binding */ unstable_getStaticPaths),\n/* harmony export */   unstable_getStaticProps: () => (/* binding */ unstable_getStaticProps)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/pages/module.compiled */ \"(pages-dir-node)/./node_modules/next/dist/server/route-modules/pages/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(pages-dir-node)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/build/templates/helpers */ \"(pages-dir-node)/./node_modules/next/dist/build/templates/helpers.js\");\n/* harmony import */ var private_next_pages_document__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! private-next-pages/_document */ \"(pages-dir-node)/./node_modules/next/dist/pages/_document.js\");\n/* harmony import */ var private_next_pages_document__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(private_next_pages_document__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var private_next_pages_app__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! private-next-pages/_app */ \"(pages-dir-node)/./node_modules/next/dist/pages/_app.js\");\n/* harmony import */ var private_next_pages_app__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(private_next_pages_app__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./pages/confirmation.jsx */ \"(pages-dir-node)/./pages/confirmation.jsx\");\n\n\n\n// Import the app and document modules.\n\n\n// Import the userland code.\n\n// Re-export the component (should be the default export).\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'default'));\n// Re-export methods.\nconst getStaticProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'getStaticProps');\nconst getStaticPaths = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'getStaticPaths');\nconst getServerSideProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'getServerSideProps');\nconst config = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'config');\nconst reportWebVitals = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'reportWebVitals');\n// Re-export legacy methods.\nconst unstable_getStaticProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticProps');\nconst unstable_getStaticPaths = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticPaths');\nconst unstable_getStaticParams = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticParams');\nconst unstable_getServerProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getServerProps');\nconst unstable_getServerSideProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getServerSideProps');\n// Create and export the route module that will be consumed.\nconst routeModule = new next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__.PagesRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.PAGES,\n        page: \"/confirmation\",\n        pathname: \"/confirmation\",\n        // The following aren't used in production.\n        bundlePath: '',\n        filename: ''\n    },\n    components: {\n        // default export might not exist when optimized for data only\n        App: (private_next_pages_app__WEBPACK_IMPORTED_MODULE_4___default()),\n        Document: (private_next_pages_document__WEBPACK_IMPORTED_MODULE_3___default())\n    },\n    userland: _pages_confirmation_jsx__WEBPACK_IMPORTED_MODULE_5__\n});\n\n//# sourceMappingURL=pages.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL25vZGVfbW9kdWxlcy9uZXh0L2Rpc3QvYnVpbGQvd2VicGFjay9sb2FkZXJzL25leHQtcm91dGUtbG9hZGVyL2luZGV4LmpzP2tpbmQ9UEFHRVMmcGFnZT0lMkZjb25maXJtYXRpb24mcHJlZmVycmVkUmVnaW9uPSZhYnNvbHV0ZVBhZ2VQYXRoPS4lMkZwYWdlcyUyRmNvbmZpcm1hdGlvbi5qc3gmYWJzb2x1dGVBcHBQYXRoPXByaXZhdGUtbmV4dC1wYWdlcyUyRl9hcHAmYWJzb2x1dGVEb2N1bWVudFBhdGg9cHJpdmF0ZS1uZXh0LXBhZ2VzJTJGX2RvY3VtZW50Jm1pZGRsZXdhcmVDb25maWdCYXNlNjQ9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBd0Y7QUFDaEM7QUFDRTtBQUMxRDtBQUN5RDtBQUNWO0FBQy9DO0FBQ3FEO0FBQ3JEO0FBQ0EsaUVBQWUsd0VBQUssQ0FBQyxvREFBUSxZQUFZLEVBQUM7QUFDMUM7QUFDTyx1QkFBdUIsd0VBQUssQ0FBQyxvREFBUTtBQUNyQyx1QkFBdUIsd0VBQUssQ0FBQyxvREFBUTtBQUNyQywyQkFBMkIsd0VBQUssQ0FBQyxvREFBUTtBQUN6QyxlQUFlLHdFQUFLLENBQUMsb0RBQVE7QUFDN0Isd0JBQXdCLHdFQUFLLENBQUMsb0RBQVE7QUFDN0M7QUFDTyxnQ0FBZ0Msd0VBQUssQ0FBQyxvREFBUTtBQUM5QyxnQ0FBZ0Msd0VBQUssQ0FBQyxvREFBUTtBQUM5QyxpQ0FBaUMsd0VBQUssQ0FBQyxvREFBUTtBQUMvQyxnQ0FBZ0Msd0VBQUssQ0FBQyxvREFBUTtBQUM5QyxvQ0FBb0Msd0VBQUssQ0FBQyxvREFBUTtBQUN6RDtBQUNPLHdCQUF3QixrR0FBZ0I7QUFDL0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLGFBQWEsK0RBQVc7QUFDeEIsa0JBQWtCLG9FQUFnQjtBQUNsQyxLQUFLO0FBQ0wsWUFBWTtBQUNaLENBQUM7O0FBRUQiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYWdlc1JvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9wYWdlcy9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IGhvaXN0IH0gZnJvbSBcIm5leHQvZGlzdC9idWlsZC90ZW1wbGF0ZXMvaGVscGVyc1wiO1xuLy8gSW1wb3J0IHRoZSBhcHAgYW5kIGRvY3VtZW50IG1vZHVsZXMuXG5pbXBvcnQgKiBhcyBkb2N1bWVudCBmcm9tIFwicHJpdmF0ZS1uZXh0LXBhZ2VzL19kb2N1bWVudFwiO1xuaW1wb3J0ICogYXMgYXBwIGZyb20gXCJwcml2YXRlLW5leHQtcGFnZXMvX2FwcFwiO1xuLy8gSW1wb3J0IHRoZSB1c2VybGFuZCBjb2RlLlxuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi4vcGFnZXMvY29uZmlybWF0aW9uLmpzeFwiO1xuLy8gUmUtZXhwb3J0IHRoZSBjb21wb25lbnQgKHNob3VsZCBiZSB0aGUgZGVmYXVsdCBleHBvcnQpLlxuZXhwb3J0IGRlZmF1bHQgaG9pc3QodXNlcmxhbmQsICdkZWZhdWx0Jyk7XG4vLyBSZS1leHBvcnQgbWV0aG9kcy5cbmV4cG9ydCBjb25zdCBnZXRTdGF0aWNQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAnZ2V0U3RhdGljUHJvcHMnKTtcbmV4cG9ydCBjb25zdCBnZXRTdGF0aWNQYXRocyA9IGhvaXN0KHVzZXJsYW5kLCAnZ2V0U3RhdGljUGF0aHMnKTtcbmV4cG9ydCBjb25zdCBnZXRTZXJ2ZXJTaWRlUHJvcHMgPSBob2lzdCh1c2VybGFuZCwgJ2dldFNlcnZlclNpZGVQcm9wcycpO1xuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IGhvaXN0KHVzZXJsYW5kLCAnY29uZmlnJyk7XG5leHBvcnQgY29uc3QgcmVwb3J0V2ViVml0YWxzID0gaG9pc3QodXNlcmxhbmQsICdyZXBvcnRXZWJWaXRhbHMnKTtcbi8vIFJlLWV4cG9ydCBsZWdhY3kgbWV0aG9kcy5cbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U3RhdGljUHJvcHMnKTtcbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQYXRocyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U3RhdGljUGF0aHMnKTtcbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQYXJhbXMgPSBob2lzdCh1c2VybGFuZCwgJ3Vuc3RhYmxlX2dldFN0YXRpY1BhcmFtcycpO1xuZXhwb3J0IGNvbnN0IHVuc3RhYmxlX2dldFNlcnZlclByb3BzID0gaG9pc3QodXNlcmxhbmQsICd1bnN0YWJsZV9nZXRTZXJ2ZXJQcm9wcycpO1xuZXhwb3J0IGNvbnN0IHVuc3RhYmxlX2dldFNlcnZlclNpZGVQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U2VydmVyU2lkZVByb3BzJyk7XG4vLyBDcmVhdGUgYW5kIGV4cG9ydCB0aGUgcm91dGUgbW9kdWxlIHRoYXQgd2lsbCBiZSBjb25zdW1lZC5cbmV4cG9ydCBjb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBQYWdlc1JvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5QQUdFUyxcbiAgICAgICAgcGFnZTogXCIvY29uZmlybWF0aW9uXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9jb25maXJtYXRpb25cIixcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBhcmVuJ3QgdXNlZCBpbiBwcm9kdWN0aW9uLlxuICAgICAgICBidW5kbGVQYXRoOiAnJyxcbiAgICAgICAgZmlsZW5hbWU6ICcnXG4gICAgfSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIC8vIGRlZmF1bHQgZXhwb3J0IG1pZ2h0IG5vdCBleGlzdCB3aGVuIG9wdGltaXplZCBmb3IgZGF0YSBvbmx5XG4gICAgICAgIEFwcDogYXBwLmRlZmF1bHQsXG4gICAgICAgIERvY3VtZW50OiBkb2N1bWVudC5kZWZhdWx0XG4gICAgfSxcbiAgICB1c2VybGFuZFxufSk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhZ2VzLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fconfirmation&preferredRegion=&absolutePagePath=.%2Fpages%2Fconfirmation.jsx&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!\n");

/***/ }),

/***/ "(pages-dir-node)/./pages/confirmation.jsx":
/*!********************************!*\
  !*** ./pages/confirmation.jsx ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ ConfirmationPage)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _components_Confirmation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/Confirmation */ \"(pages-dir-node)/./components/Confirmation.jsx\");\n// confirmation.jsx - Confirmation after oath\n\n\nfunction ConfirmationPage() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_Confirmation__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {}, void 0, false, {\n        fileName: \"/Users/matthewmauer/Desktop/SoulfraWorkspace/soulfra-dev/pages/confirmation.jsx\",\n        lineNumber: 5,\n        columnNumber: 12\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL2NvbmZpcm1hdGlvbi5qc3giLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLDZDQUE2Qzs7QUFDUztBQUV2QyxTQUFTQztJQUNwQixxQkFBTyw4REFBQ0QsZ0VBQVlBOzs7OztBQUN4QiIsInNvdXJjZXMiOlsiL1VzZXJzL21hdHRoZXdtYXVlci9EZXNrdG9wL1NvdWxmcmFXb3Jrc3BhY2Uvc291bGZyYS1kZXYvcGFnZXMvY29uZmlybWF0aW9uLmpzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBjb25maXJtYXRpb24uanN4IC0gQ29uZmlybWF0aW9uIGFmdGVyIG9hdGhcbmltcG9ydCBDb25maXJtYXRpb24gZnJvbSAnLi4vY29tcG9uZW50cy9Db25maXJtYXRpb24nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDb25maXJtYXRpb25QYWdlKCkge1xuICAgIHJldHVybiA8Q29uZmlybWF0aW9uIC8+O1xufVxuIl0sIm5hbWVzIjpbIkNvbmZpcm1hdGlvbiIsIkNvbmZpcm1hdGlvblBhZ2UiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/confirmation.jsx\n");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fconfirmation&preferredRegion=&absolutePagePath=.%2Fpages%2Fconfirmation.jsx&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!")));
module.exports = __webpack_exports__;

})();