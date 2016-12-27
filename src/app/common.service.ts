export interface DynamicConfiguration {
    is_stop?: boolean,
    DESC?: boolean,
    id_key?: string,
}
// 通用的基于IndexedDB的Service基类
export class IndexedDBService {
    db: Promise<IDBDatabase>;
    constructor(public dbname: string) {
        var openRequest = indexedDB.open(dbname, 1);
        this.db = new Promise((resolve, reject) => {
            openRequest.onupgradeneeded = (e) => {
                console.log("Upgrading...");
                var db = e.target['result'];
                db.objectStoreNames.contains("list") || db.createObjectStore("list", {
                    autoIncrement: true
                });
                db.objectStoreNames.contains("deleted_ids") || db.createObjectStore("deleted_ids");
            }
            openRequest.onsuccess = (e) => {
                console.log("Success!");
                resolve(e.target['result']);
            }
            openRequest.onerror = (e) => {
                console.log("Error");
                reject(e);
            }
        });
    }
    protected async _getRemovedIds(db_name: string) {
        const db = await this.db;
        var t = db.transaction(["deleted_ids"], "readonly");
        var store = t.objectStore("deleted_ids");
        var ob = store.get(db_name);

        return new Promise<Array<number>>((resolve, reject) => {
            ob.onsuccess = (e) => {
                resolve(ob.result || []);
            }
            ob.onerror = reject
        });
    }
    async getCount() {
        const db = await this.db;

        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");
        var cursor = store.count();
        return new Promise<number>((resolve, reject) => {
            cursor.onsuccess = (e) => {
                resolve(cursor.result)
            }
            cursor.onerror = reject;
        });
    }

    async getList<T>(start_index = 0, num = 10
        , dynamic_configuration: DynamicConfiguration = {}) {
        // >= start_index
        if (dynamic_configuration.DESC) {
            const total_num = await this.getCount();
            var max_id = Math.max(total_num - start_index, 0);

            var remove_ids = await this._getRemovedIds("list");
            remove_ids.some(v => {
                if (v > max_id) {
                    return true
                }
                max_id += 1;
            });

            var range = IDBKeyRange.upperBound(max_id);
            var direction = 'prev'
        } else {
            var remove_ids = await this._getRemovedIds("list");
            remove_ids.some(v => {
                if (v > start_index) {
                    return true
                }
                start_index += 1;
            });


            range = IDBKeyRange.lowerBound(start_index)
            direction = 'next'
        }
        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");
        var cursor = store.openCursor(range, direction);

        var id_key = dynamic_configuration.id_key || "id";
        return new Promise<T[]>((resolve, reject) => {

            var list = [];
            cursor.onsuccess = function (e) {
                var res: IDBCursorWithValue = e.target['result'];
                if (res) {
                    // console.log("Key", res.key);
                    // console.log("Data", res.value);
                    var customer: T = res.value;
                    customer[id_key] = String(res.key);// ID 统一字符串化，以便区分0和空id
                    list.push(customer);
                    if (list.length < num) {
                        res.continue();// 只要不是在Onsuccess里头立刻运行continue，光标会马上被释放
                    } else {
                        resolve(list)
                    }
                } else {
                    resolve(list)
                }
            }
            cursor.onerror = reject;
            // return list;
        });
    }
    async getListByFilter<T>(filter: (customer: T) => boolean, before_num = 0, num = 10
        , dynamic_configuration: DynamicConfiguration = {}) {


        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");
        if (dynamic_configuration.DESC) {
            var direction = "prev"
        } else {
            var direction = "next"
        }
        // >= start_index
        var cursor = store.openCursor(null, direction);

        var before_customers = [];
        var id_key = dynamic_configuration.id_key || "id";

        return new Promise<T[]>((resolve, reject) => {

            var customers = [];
            cursor.onsuccess = function (e) {
                var res: IDBCursorWithValue = e.target['result'];
                if (dynamic_configuration.is_stop) {// 中断搜索
                    resolve(customers)
                }
                if (res) {
                    // console.log("Key", res.key);
                    // console.log("Data", res.value);
                    var customer: T = res.value;
                    customer[id_key] = String(res.key);
                    if (!filter(customer)) {
                        return res.continue();
                    }

                    if (before_customers.length < before_num) {
                        before_customers.push(customer)
                    } else {
                        customers.push(customer);
                    }
                    if (customers.length < num) {
                        res.continue();// 只要不是在Onsuccess里头立刻运行continue，光标会马上被释放
                    } else {
                        resolve(customers)
                    }
                } else {
                    resolve(customers)
                }
            }
            cursor.onerror = reject;
        });

    }
    async getById<T>(id, dynamic_configuration: DynamicConfiguration = {}) {
        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        var ob = store.get(parseInt(id));
        var id_key = dynamic_configuration.id_key || "id";

        return new Promise<T>((resolve, reject) => {
            ob.onsuccess = (e) => {
                var customer: T = ob.result;
                customer[id_key] = String(id);
                resolve(customer);
            }
            ob.onerror = reject
        });
    }

    async add<T>(new_item: T, key?: number) {
        const db = await this.db;

        // 寻找递增用的ID
        if (!key) {
            let quene_key = 0;
            let t = db.transaction(["list"], "readwrite");
            let store = t.objectStore("list");
            let cursor = store.openCursor(IDBKeyRange.lowerBound(0), 'prev');
            await new Promise((resolve, reject) => {
                cursor.onsuccess = function (e) {
                    let res: IDBCursorWithValue = e.target['result'];
                    if (res) {
                        quene_key = parseInt(res.key + "");
                    }
                    resolve();
                }
                cursor.onerror = reject;
            });

            let removed_ids = await this._getRemovedIds("list");
            let max_removed_key = removed_ids[removed_ids.length - 1] || 0;
            key = Math.max(quene_key, max_removed_key) + 1;
        }

        let t = db.transaction(["list"], "readwrite");
        let store = t.objectStore("list");
        var request = store.add(new_item, key);
        return new Promise<number>((resolve, reject) => {
            request.onerror = function (e) {
                reject(e);
            }

            request.onsuccess = function (e) {
                resolve(request.result);
            }
        });

    }
    async update<T>(id, customer: T): Promise<number> {
        const db = await this.db;
        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");

        var request = store.put(customer, parseInt(id));// 如果ID不存在，会被创建
        return new Promise<number>((resolve, reject) => {
            request.onerror = function (e) {
                reject(e);
            }

            request.onsuccess = function (e) {
                resolve(request.result);
            }
        });

    }
    async remove(id) {
        const db = await this.db;

        id = parseInt(id);

        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");
        var request = store.delete(id);
        return new Promise<number>((resolve, reject) => {

            request.onsuccess = async () => {
                console.log('delete success')
                // 把删除的ID添加到“移除记录表”中
                var remove_ids = await this._getRemovedIds("list");
                remove_ids.push(id);
                remove_ids.sort((a, b) => a - b);

                const db = await this.db;
                var t = db.transaction(["deleted_ids"], "readwrite");
                var store = t.objectStore("deleted_ids");
                var ob = store.put(remove_ids, 'list');

                await new Promise((resolve, reject) => {
                    ob.onsuccess = resolve
                    ob.onerror = reject
                });

                resolve(request.result);
            }
            request.onerror = reject
        });
    }
    async clear() {

        const db = await this.db;
        var t = db.transaction(["list", "deleted_ids"], "readwrite");
        var list_store = t.objectStore("list");
        var deleted_ids_store = t.objectStore("deleted_ids");
        await Promise.all([
            list_store.clear(),
            deleted_ids_store.clear(),
        ].map(request => {
            return new Promise<number>((resolve, reject) => {
                request.onsuccess = () => { resolve(request.result) };
                request.onerror = reject
            });
        }));

    }
    async backup() {
        var list = await this.getList();
        var deleted_ids = await this._getRemovedIds("list");
        return { list, deleted_ids };
    }
    async restore(backupData) {
        await this.clear();
        var {list, deleted_ids} = backupData;
        for (var i = 0, len = list.length; i < len; i += 1) {
            var item = list[i];
            this.add(item, parseInt(item.id));
        }
        const db = await this.db;
        var t = db.transaction(["deleted_ids"], "readwrite");
        var deleted_ids_store = t.objectStore("deleted_ids");
        var ob = deleted_ids_store.put(deleted_ids, 'list');

        await new Promise((resolve, reject) => {
            ob.onsuccess = resolve
            ob.onerror = reject
        });
    }
}


export interface SearchResultWithWeight {
    weight?: number
}
// 搜索功能拓展类
export class CommonSearch<T> {
    constructor(
        public _service: IndexedDBService,
        public search_keys: string[]
    ) { }

    search_text = "";
    search_list: (T & SearchResultWithWeight)[] = [];
    show_search_list_num = 3; // 显示10个
    is_search_able = false;
    is_searching = false;
    currrent_dynamic_configuration: any = {}
    private _search_pid: number //用于校验搜索结果属于正确的搜索进程中
    search_progress = 0;
    async search() {
        var search_text = this.search_text.trim();
        // 中断上一次搜索
        this.currrent_dynamic_configuration.is_stop = true;
        // 重置新的搜索配置
        this.currrent_dynamic_configuration = {};
        // 清空数据
        this.search_list = [];
        if (search_text) {
            this.search_progress = 0; //重置进度条
            this.is_search_able = true;
            this.is_searching = true;
            var weight_list = [];
            var total_count = await this._service.getCount();
            var _search_progress = 0;
            var _search_pid = this._search_pid = Math.random();
            await this._service.getListByFilter<T>((item) => {
                if (_search_pid !== this._search_pid) { // 搜索进程对应有误
                    return
                }
                var total_weight = this.search_keys.reduce((weight, key) => weight + CommonSearch.getSearchWeight(item[key], search_text), 0)
                if (total_weight) {
                    this.search_list.push(Object.assign({
                        weight: total_weight
                    }, item));
                    this.search_list.sort((item_a, item_b) => item_b.weight - item_a.weight);
                    if (this.search_list.length > this.show_search_list_num) {
                        this.search_list.length = this.show_search_list_num
                    }
                }
                _search_progress += 1;
                this.search_progress = _search_progress / total_count * 100;
                return total_weight > 0;
            }, 0, total_count, this.currrent_dynamic_configuration)
            this.is_searching = false;
        } else {
            this.is_search_able = false;
        }
        return this.search_list;
    }
    static getSearchWeight(source_text: string, search_text: string) {
        var weight = 0;
        var mul_match_score = 0; // 连续匹配的分数
        var pre_match_index = -1;
        for (var i = 0, len = search_text.length; i < len; i += 1) {
            if (source_text.indexOf(search_text.charAt(i)) !== -1) {
                if (pre_match_index === i - 1) {
                    mul_match_score += 1;
                } else {
                    // 匹配中断，重置连续匹配的分数加成
                    mul_match_score = 1;
                }
                weight += mul_match_score;
                pre_match_index = i;
            } else {
                // 匹配中断，重置连续匹配的分数加成
                mul_match_score = 1;
            }
        }
        return weight;
    }
}