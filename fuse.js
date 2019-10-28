const { FuseBox } = require("fuse-box");

const fuse = FuseBox.init({
	homeDir: "src/",
	target: "server@es6",
	output: "lib/$name.js",
	sourceMaps: { inline: false },
	plugins: [],
});

fuse.bundle("glson.es", "! [main.ts]");
fuse.run();
