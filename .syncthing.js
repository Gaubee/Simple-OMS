const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
var ignore_keys = ["node_modules", "dist", ".git", 'YOMS-win32-x64', '.awcache'];
var watch_deep = 4;
var watch_dirs = ["./"];

var loop_dirs = watch_dirs;
var cur_deep = 0;
do {
    var dirs = [];
    loop_dirs.forEach(dir => {
        fs.readdirSync(dir).forEach(foldername => {
            if (foldername) {
                if (ignore_keys.some(ignore_key => foldername.indexOf(ignore_key) !== -1)) {
                    return false
                }
                var filepath = path.join(dir, foldername)
                if (fs.lstatSync(filepath).isDirectory()) {
                    dirs.push(filepath)
                }
            }
        });
    });
    watch_dirs = watch_dirs.concat(dirs);//合并到结果
    loop_dirs = dirs;//更新要循环的目录
    cur_deep += 1;
} while (cur_deep <= watch_deep);
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
        if (filename.startsWith("~") || filename.startsWith(".")) {
            return
        }
        console.log(dir, event, filename);
        child_process.execSync(syncthing_exec);
    });
});
child_process.execSync(syncthing_exec);
