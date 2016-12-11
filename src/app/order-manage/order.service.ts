import { Injectable } from '@angular/core';
import { Customer, CustomerService } from '../customer-manage/customer.service';
import { Material, MaterialService } from '../material-manage/material.service';
import { copy } from '../common';

export interface Order {
    id?: string,
    customer_id?: string,
    customer?: Customer,

    nodes: OrderNode[],

    // 订单总计价格
    order_price?: number,

    remark?: string

    create_time?: Date
}
export interface OrderNode {

    type_id?: string,
    type?: Type,
    material_id?: string,
    material?: Material,

    size_list: Size[];

    machining_remark?: string;
    machining_price?: number;

    // 价格合计
    total_price?: number
}

export interface Size {
    width?: number,
    height?: number,
    area?: number,
}

export const SIZE_DEFAULT: Size = {
    width: 0,
    height: 0,
    area: 0,
};
export const ORDERNODE_DEFAULT: OrderNode = {
    size_list: [SIZE_DEFAULT],
    machining_remark: "",
    machining_price: 0
};
export const ORDER_DEFAULT: Order = {
    customer: {
        name: "",
        phone: "",
        address: "",
    },
    nodes: [copy(ORDERNODE_DEFAULT)],
    remark: ""
};

export const ORDERS: Order[] = [
    // { id: "1", name: "红金龙", price: 100, create_time: new Date('2016-10-10') },
    // { id: "2", name: "红ZZ", price: 200, create_time: new Date('2016-10-8') },
    // { id: "3", name: "红色人工石", price: 300, create_time: new Date('2016-10-3') },
];



export interface Type {
    id: string,
    value: string
}

const TYPES: Type[] = [{
    id: '1',
    value: '类目1'
},
{
    id: '2',
    value: '类目2'
},
{
    id: '3',
    value: '类目3'
},];

@Injectable()
export class OrderService {
    constructor(
        private _material_service: MaterialService,
        private _customer_service: CustomerService
    ) {
        var openRequest = indexedDB.open("order", 1);
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
    async getOrders(page = 0, num = 10): Promise<Order[]> {
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
        var cursor = store.openCursor(IDBKeyRange.lowerBound(start_index));

        var orders = [];
        cursor.onsuccess = function (e) {
            var res: IDBCursorWithValue = e.target['result'];
            if (res) {
                console.log("Key", res.key);
                console.log("Data", res.value);
                var order: Order = res.value;
                order.id = String(res.key);
                orders.push(order);
                if (orders.length < num) {
                    res.continue();// 只要不是在Onsuccess里头立刻运行continue，光标会马上被释放
                }
            }
        }
        return orders;
    }
    async getOrdersByFilter(filter: (order: Order) => boolean, page = 0, num = 10): Promise<Order[]> {


        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        // >= start_index
        var cursor = store.openCursor();

        var before_num = page * num;
        var before_orders = [];
        return new Promise<Order[]>((resolve, reject) => {

            var orders = [];
            cursor.onsuccess = function (e) {
                var res: IDBCursorWithValue = e.target['result'];
                if (res) {
                    console.log("Key", res.key);
                    console.log("Data", res.value);
                    var order: Order = res.value;
                    order.id = String(res.key);
                    if (!filter(order)) {
                        return res.continue();
                    }

                    if (before_orders.length < before_num) {
                        before_orders.push(order)
                    } else {
                        orders.push(order);
                    }
                    if (orders.length < num) {
                        res.continue();// 只要不是在Onsuccess里头立刻运行continue，光标会马上被释放
                    } else {
                        resolve(orders)
                    }
                } else {
                    resolve(orders)
                }
            }
            cursor.onerror = reject;
            return orders;
        });

    }
    async getOrderById(id): Promise<Order> {
        const db = await this.db;
        var t = db.transaction(["list"], "readonly");
        var store = t.objectStore("list");

        var ob = store.get(parseInt(id));
        return new Promise<Order>((resolve, reject) => {
            ob.onsuccess = function (e) {
                var order: Order = ob.result;
                order.id = String(id);
                resolve(order);
            }
            ob.onerror = function (e) {
                reject(e);
            }
        });

    }
    async wrapFullOrder(order: Order): Promise<Order> {

        var customer_promise = this._customer_service.getCustomerById(order.customer_id);
        order.customer = await customer_promise;
        order.nodes.forEach(async node => {
            var material_promise = this._material_service.getMaterialById(node.material_id);
            var type_promise = this.getTypeById(node.type_id);
            node.material = await material_promise;
            node.type = await type_promise;
        });
        return order;
    }
    async addOrder(new_order: Order): Promise<number> {
        if (!new_order.customer_id) {// 如果没有用户ID，进行创建
            new_order.customer_id = String(await this._customer_service.addCustomer(new_order.customer));
        }
        const db = await this.db;
        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");

        delete new_order.id
        new_order.create_time = new Date;
        var request = store.add(new_order);
        return new Promise<number>((resolve, reject) => {
            request.onerror = function (e) {
                reject(e);
            }

            request.onsuccess = function (e) {
                resolve(request.result);
            }
        });

    }
    async updateOrder(id, order: Order): Promise<number> {
        const db = await this.db;
        var t = db.transaction(["list"], "readwrite");
        var store = t.objectStore("list");

        var request = store.put(order, parseInt(id));// 如果ID不存在，会被创建
        return new Promise<number>((resolve, reject) => {
            request.onerror = function (e) {
                reject(e);
            }

            request.onsuccess = function (e) {
                resolve(request.result);
            }
        });

    }
    async deleteOrder(id) {
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
    async getTypes() {// TODO：如果Type模型变复杂了，转移到独立的Service中维护
        return TYPES
    }
    async getTypeById(id) {
        var res: Type;

        TYPES.some(type => {
            if (type.id == id) {
                res = type
                return true;
            }
        });
        if (!res) {
            throw new ReferenceError("type no found:" + id)
        }
        return res;
    }
}