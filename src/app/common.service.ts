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

        // >= start_index
        var cursor = store.openCursor();

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

    async add<T>(new_item: T) {
        const db = await this.db;
        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");

        var request = store.add(new_item);
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
}