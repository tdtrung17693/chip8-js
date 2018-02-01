module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "airbnb-base",
    "parser": "babel-eslint",
    "rules": {
        "indent": [2, 4],
        "no-console": 0,
        "space-in-parens": [ 2, "always" ],
        "array-bracket-spacing": [ 2, "always" ],
        "object-curly-spacing": [ 2, "always" ],
        "computed-property-spacing": [ 2, "always" ],
        "no-multiple-empty-lines": [ 2, { "max": 1, "maxEOF": 0, "maxBOF": 0 } ],

        "quotes": [ 2, "double", "avoid-escape" ],

        // code arrangement matter
        "no-use-before-define": [ 2, { "functions": false } ],
        "no-param-reassign": [ "error", { "props": false } ],

        // make it meaningful
        "prefer-const": 1,
        "no-bitwise": 0,
        "no-mixed-operators": 0,
        "prefer-destructuring": 0,
    }
};
