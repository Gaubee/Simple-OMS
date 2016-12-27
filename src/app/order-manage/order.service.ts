import { Injectable } from '@angular/core';
import { Customer, CustomerService } from '../customer-manage/customer.service';
import { Material, MaterialService, Category } from '../material-manage/material.service';
import { copy } from '../common';
import { IndexedDBService, DynamicConfiguration } from '../common.service';

export interface Order {
    id?: string,
    customer_id?: string,
    customer?: Customer,

    nodes: OrderNode[],

    // 订单总计价格
    order_price?: number,

    remark?: string

    create_time?: Date

    // 编辑保护
    is_lock?: boolean
}
export interface OrderNode {

    type_id?: string,
    type?: Category,
    material_id?: string,
    material?: Material,
    color?: string,

    size_list: Size[];

    machining_remark?: string;
    machining_price?: number;
    custom_material_price?:number;

    // 价格合计
    total_price?: number

    // 计算类型
    calcType?: CalcType
}
export enum CalcType {
    面积,
    长度,
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
    machining_price: 0,
    calcType: CalcType.面积
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
export class OrderService extends IndexedDBService {
    constructor(
        private _material_service: MaterialService,
        private _customer_service: CustomerService
    ) {
        super('order');
    }
    getOrdersCount = this.getCount
    getOrders(start_index = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Order[]> {
        return this.getList<Order>(start_index, num, dynamic_configuration);
    }
    getOrdersByFilter(filter: (order: Order) => boolean, before_num = 0, num = 10
        , dynamic_configuration: DynamicConfiguration): Promise<Order[]> {
        return this.getListByFilter<Order>(filter, before_num, num, dynamic_configuration);
    }
    getOrderById(id): Promise<Order> {
        return this.getById<Order>(id)
    }
    // async wrapFullOrder(order: Order): Promise<Order> {

    //     var customer_promise = this._customer_service.getCustomerById(order.customer_id);
    //     order.customer = await customer_promise;
    //     order.nodes.forEach(async node => {
    //         var material_promise = this._material_service.getMaterialById(node.material_id);
    //         var type_promise = this.getTypeById(node.type_id);
    //         node.material = await material_promise;
    //         node.type = await type_promise;
    //     });
    //     return order;
    // }
    async addOrder(new_order: Order): Promise<number> {
        new_order.create_time = new Date;
        new_order.is_lock = true;//锁定加以保护
        if (!new_order.customer_id) {// 如果没有用户ID，进行创建,TODO:弃用这个多余的保护
            new_order.customer_id = String(await this._customer_service.addCustomer(new_order.customer));
        }
        return this.add(new_order);
    }
    updateOrder(id, order: Order): Promise<number> {
        return this.update(id, order)
    }
    deleteOrder = this.remove
}