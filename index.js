"use strict";

const gutil = require("gulp-util");
const through = require("through2");
const generator = require("loopback-sdk-angular");
const path = require("path");
const Q = require("q");

module.exports = function(options) {
	return through.obj(function(file, enc, cb) {
			if (file.isNull()) {
				this.push(file);
				cb();
				return;
			}

			Q
				.fcall(() => {
					let app = require(path.resolve(file.path));

					//  In case options is undefined.
					options = options || {ngModuleName: "lbServices", apiUrl: undefined};

					options.ngModuleName = options.ngModuleName || "lbServices";
					options.apiUrl = options.apiUrl || app.get("restApiRoot") || "/api";

					gutil.log("Loaded LoopBack app", gutil.colors.magenta(file.path));
					gutil.log("Generating",
						gutil.colors.magenta(options.ngModuleName),
						"for the API endpoint",
						gutil.colors.magenta(options.apiUrl)
					);
					return app;

				})
				.then((app) => {
					return app
						.boot()
						.then(() => {
							let script = generator.services(
								app,
								options.ngModuleName,
								options.apiUrl
							);

							file.contents = new Buffer(script);

							gutil.log("Generated Angular services file.");

							this.push(file);
						})
						.then(() => app.shutdown())
						.then(() => file);
				})
				.fail((err) => {
					this.emit("error", new gutil.PluginError("gulp-loopback-sdk-angular", err));
				})
				.nodeify(cb);
		}
	);
};
