let log = () => {};
let setConfig = () => {};

/**
 * Config Tag
 * ----------
 * tag_name => activate_state
 * @type {Object}
 */
let config = {};

if ( process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test" ) {
    log = ( tag, ...content ) => {
        if ( typeof tag !== "string" ) return;
        if ( tag in config && config[ tag ] ) {
            console.log( `[${tag}]`, ...content );
        }
    };

    setConfig = ( userConfig ) => {
        config = { ...userConfig };
    };
}

export default {
    log,
    setConfig,
};
