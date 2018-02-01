const path = require( "path" );
const webpack = require( "webpack" );

const config = {
    devtool: "source-map",

    entry: {
        bundle: [ "./src/main.js" ],
    },

    output: {
        path: path.resolve( __dirname, "dist/js" ),
        filename: "bundle.js",
    },

    devServer: {
        contentBase: path.join( __dirname, "public" ),
        compress: true,
        port: 9000,
        hot: true,
        stats: "errors-only",
        overlay: true,
        publicPath: "/assets/",
    },

    module: {
        rules: [ {
            test: /\.js?$/,
            exclude: /node_modules/,
            use: [ {
                loader: "babel-loader",
            } ],
        } ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {},
};

// Hot mode
config.devtool = "eval";
config.entry.bundle.unshift( "webpack/hot/only-dev-server" );
config.entry.bundle.unshift( "webpack-dev-server/client?http://localhost:9000" );
config.output.publicPath = "http://localhost:9000/";

if ( process.env.NODE_ENV === "production" ) {
    config.devtool = false;
    config.debug = false;
    config.plugins.push( new webpack.optimize.OccurrenceOrderPlugin() );
    config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
}

module.exports = config;
