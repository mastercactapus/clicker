module.exports = {
	entry: [
		"bootstrap-webpack!./bootstrap.config.js",
		"./public/main.jsx",
	],

	output: {
		path: __dirname + "/public",
		filename: "bundle.js"
	},

	devtool: "inline-source-map",

	module: {
        loaders: [
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.jsx$/, loader: 'jsx-loader' }
        ]
    }
};
