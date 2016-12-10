const fs = require("fs");
const child_process = require("child_process");
var ignore_keys = ["/node_modules",".git"];
var watch_deep = 4;
var watch_dirs = ["./"];
var ls_exec = "ls -d .";
do {
	ls_exec += "/*";
	var dirs = child_process.execSync(ls_exec).toString().split('\n').filter(foldername => {
		if (foldername) {
			if (ignore_keys.some(ignore_key => foldername.indexOf(ignore_key) !== -1)) {
				return false
			}
			return fs.lstatSync(foldername).isDirectory();
		}
	});
	watch_dirs = watch_dirs.concat(dirs);
} while (watch_deep -= 1);
console.log(`监听以下目录：\n  ${watch_dirs.join("\n  ").trim()}`);

const syncthing_exec_server = `curl -X POST -H "X-API-Key:TqpmoNxS7umNRDmhiCcsmpNJTny7Vund" http://120.25.236.186:8384/rest/db/scan?folder=e9zkn-74kxw`;
const syncthing_exec_client = `curl -X POST -H "X-API-Key:E5xpdmffjUNeuKfmn9n2ExyioC3F7o5J" http://127.0.0.1:8384/rest/db/scan?folder=e9zkn-74kxw`;
var is_server = process.argv[2] || "";
if (is_server.toLowerCase()[0] === "s") {
	console.log("启用服务端同步指令");
	var syncthing_exec = syncthing_exec_server
} else {
	console.log("启用客户端同步指令");
	syncthing_exec = syncthing_exec_client
}
watch_dirs.forEach(dir => {
	fs.watch(dir, (event, filename) => {
		if(filename.startsWith("~")||filename.startsWith(".")){
			return
		}
		console.log(dir, event, filename);
		child_process.execSync(syncthing_exec);
	});
});