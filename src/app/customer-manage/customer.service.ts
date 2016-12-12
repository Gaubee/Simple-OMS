import { Injectable } from '@angular/core';
import { copy, mix_options } from '../common';

const CUSTOMERS: Customer[] = [

]

@Injectable()
export class CustomerService {

    constructor() {
        var openRequest = indexedDB.open("customer", 1);
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
    db: Promise<IDBDatabase>;
    private async _getRemovedIds(db_name: string): Promise<Array<number>> {
        const db = await this.db;
        var t = db.transaction(["deleted_ids"], "readonly");
        var store = t.objectStore("deleted_ids");
        var ob = store.get(db_name);

        return new Promise<Array<any>>((resolve, reject) => {
            ob.onsuccess = function (e) {
                resolve(ob.result || []);
            }
            ob.onerror = function (e) {
                reject(e);
            }
        });
    }
    async getCustomersCount() {
        const db = await this.db;

        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");
        var cursor = store.count();
        return new Promise<number>((resolve, reject) => {
            cursor.onsuccess = function (e) {
                resolve(cursor.result)
            }
            cursor.onerror = reject;
        });
    }
    async getCustomers(page = 0, num = 10, dynamic_configuration: {
        is_stop?: boolean,
        DESC?: boolean
    } = {}): Promise<Customer[]> {
        var remove_ids = await this._getRemovedIds("list");
        var start_index = page * num;
        var pre_remove_num = 0;// 在start_index前被移除的对象数量
        remove_ids.some(v => {
            if (v > start_index) {
                return true
            }
            start_index += 1;
        });

        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        // >= start_index
        var cursor = store.openCursor(IDBKeyRange.lowerBound(start_index), dynamic_configuration.DESC ? 'prev' : 'next');
        return new Promise<Customer[]>((resolve, reject) => {

            var customers = [];
            cursor.onsuccess = function (e) {
                var res: IDBCursorWithValue = e.target['result'];
                if (res) {
                    // console.log("Key", res.key);
                    // console.log("Data", res.value);
                    var customer: Customer = res.value;
                    customer.id = String(res.key);
                    customers.push(customer);
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
            // return customers;
        });
    }

    async getCustomersByFilter(filter: (customer: Customer) => boolean, page = 0, num = 10
        , dynamic_configuration: {
            is_stop?: boolean
        } = {}): Promise<Customer[]> {


        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        // >= start_index
        var cursor = store.openCursor();

        var before_num = page * num;
        var before_customers = [];
        return new Promise<Customer[]>((resolve, reject) => {

            var customers = [];
            cursor.onsuccess = function (e) {
                var res: IDBCursorWithValue = e.target['result'];
                if (dynamic_configuration.is_stop) {// 中断搜索
                    resolve(customers)
                }
                if (res) {
                    // console.log("Key", res.key);
                    // console.log("Data", res.value);
                    var customer: Customer = res.value;
                    customer.id = String(res.key);
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
            return customers;
        });

    }

    async getCustomerById(id) {
        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        var ob = store.get(parseInt(id));
        return new Promise<Customer>((resolve, reject) => {
            ob.onsuccess = function (e) {
                var customer: Customer = ob.result;
                customer.id = String(id);
                resolve(customer);
            }
            ob.onerror = function (e) {
                reject(e);
            }
        });
    }

    async addCustomer(new_customer: Customer): Promise<number> {
        new_customer = mix_options(copy(CUSTOMER_DEFAULT), new_customer);
        const db = await this.db;
        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");

        var request = store.add(new_customer);
        return new Promise<number>((resolve, reject) => {
            request.onerror = function (e) {
                reject(e);
            }

            request.onsuccess = function (e) {
                resolve(request.result);
            }
        });

    }
    async updateCustomer(id, customer: Customer): Promise<number> {
        customer = mix_options(copy(CUSTOMER_DEFAULT), customer);
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
    async deleteCustomer(id) {
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
                remove_ids.sort();

                const db = await this.db;
                var t = db.transaction(["deleted_ids"], "readwrite");
                var store = t.objectStore("deleted_ids");
                var ob = store.put('list', remove_ids);

                await new Promise<Array<any>>((resolve, reject) => {
                    ob.onsuccess = function (e) {
                        resolve(ob.result);
                    }
                    ob.onerror = function (e) {
                        reject(e);
                    }
                });

                resolve(request.result);
            }
            request.onerror = (e) => {
                console.log(e);
            }
        });
    }
}

export enum HUMAN_SEX {
    NULL,
    WOMAN,
    MAN,
}

export interface Customer {
    id?: string,
    avatar?: string,// 头像
    name?: string,
    phone?: string,
    address?: string,
    remark?: string,
    // sex?: HUMAN_SEX,
}

export const CUSTOMER_DEFAULT: Customer = {
    get avatar() { return `/assets/avatar/${(8 * Math.random()) | 0}.png` },
    name: "",
    phone: "",
    address: "",
    remark: "",
    // sex: HUMAN_SEX.NULL,
}