const crypto = require('crypto');
const co = require("co");
const fs = require("fs");
const path = require("path");
const os = require("os");

const koa = require("koa");
const parse = require('co-busboy');
const LocalStorage = require("node-localstorage").LocalStorage;
const localStorage = new LocalStorage(path.join(__dirname, "data"));
const app = koa();

const Backups = {
    get() {
        return JSON.parse(localStorage.getItem("backups")) || [];
    },
    set(backups) {
        localStorage.setItem("backups", JSON.stringify(backups))
    },
    add(backup) {
        var backups = Backups.get();
        backup.create_time = new Date;
        backups.push(backup);
        Backups.set(backups)
        return backup;
    },
    removeByKey(key) {
        var index = Backups.indexOf(key);
        if (index !== -1) {
            var backups = Backups.get();
            backups.splice(index, 1);
            Backups.set(backups);
        }
        return index;
    },
    indexOf(key) {
        var backups = Backups.get();
        var index = -1;
        backups.some((backup, i) => {
            if (backup.key == key) {
                index = i;
                return true
            }
        });
        return index;
    },
    hasByKey(key) {
        return Backups.indexOf(key) !== -1;
    },
    getByKey(key) {
        var index = Backups.indexOf(key);
        if (index !== -1) {
            var backups = Backups.get();
            return backups[index];
        }
    }
}

app.use(function* (next) {
    this.set("Access-Control-Allow-Origin", '*');
    this.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, X-XSRF-TOKEN");
    this.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    console.log(this.url, this.method, this.query);
    if (this.url.startsWith("/backup")) {
        if (this.method === "GET") {
            if (this.query.key) {
                if (this.query.type === "download-url") {
                    if (!Backups.hasByKey(this.query.key)) {
                        throw "key no found!";
                    }
                    this.body = fs.readFileSync("./uploads/" + this.query.key);
                } else {
                    var ret = Backups.getByKey(this.query.key);
                    if (!ret) {
                        throw "key no found!";
                    }
                    this.body = ret;
                }
            } else {
                let backups = Backups.get();
                this.body = backups.slice().reverse();
            }
        } else if (this.method === "POST") {

            var parts = parse(this);
            var part = yield parts;
            if (part) {
                // var filePath = path.join(os.tmpdir(), (new Date).toLocaleDateString() + ".db")
                if (part.length) {
                    var fileData = part[1]

                    // fs.writeFileSync(filePath, part[1])
                } else {
                    var fileData = yield new Promise((resolve, reject) => {
                        var chunks = []
                        part.on("data", (chunk) => {
                            chunks.push(chunk)
                        });
                        part.on("error", reject);
                        part.on("end", () => {
                            resolve(Buffer.concat(chunks));
                        })
                    });

                    // var stream = fs.createWriteStream(filePath);
                    // part.pipe(stream);
                }
            } else {
                throw "no db file upoload."
            }
            let md5_hash_builder = crypto.createHash('md5');
            md5_hash_builder.update(fileData);
            console.log(fileData.toString());

            let hash = md5_hash_builder.digest('hex');
            let key = hash + '.jsondb';

            if (Backups.hasByKey(key)) {
                console.log("from cache.")
                return this.body = Backups.getByKey(key);
            }
            fs.writeFileSync("./uploads/" + key, fileData);
            var ret = { key, hash };
            Backups.add(ret);
            this.body = ret;
            console.log('this.body', this.body);
        } else if (this.method === "DELETE") {
            if (this.query.key) {
                var key = this.query.key;

                if (!Backups.hasByKey(key)) {
                    throw "key no found!";
                }
                try {
                    fs.unlinkSync("./uploads/" + key);
                    this.body = Backups.removeByKey(key);
                } catch (e) {
                    throw "key no found";
                } finally {
                    Backups.removeByKey(key);
                }
            } else {
                throw "params error."
            }
        } else if (this.method === "OPTIONS") {
            this.body = "GET,POST,DELETE,OPTIONS";
        }
    }

});
app.listen(8860);