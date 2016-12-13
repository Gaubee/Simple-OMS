import { Injectable } from '@angular/core';
import { copy, mix_options } from '../common';
import { IndexedDBService, DynamicConfiguration } from '../common.service';

const CUSTOMERS: Customer[] = [

]

@Injectable()
export class CustomerService extends IndexedDBService {
    constructor() {
        super('customer');
    }
    db: Promise<IDBDatabase>;

    getCustomersCount = this.getCount
    
    getCustomers(start_index = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Customer[]> {
        return this.getList<Customer>(start_index, num, dynamic_configuration);
    }

    getCustomersByFilter(filter: (customer: Customer) => boolean, before_num = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Customer[]> {
        return this.getListByFilter<Customer>(filter, before_num, num, dynamic_configuration);
    }

    getCustomerById(id): Promise<Customer> {
        return this.getById<Customer>(id)
    }

    addCustomer(new_customer: Customer): Promise<number> {
        new_customer = mix_options(copy(CUSTOMER_DEFAULT), new_customer);
        return this.add(new_customer);
    }
    updateCustomer(id, customer: Customer): Promise<number> {
        customer = mix_options(copy(CUSTOMER_DEFAULT), customer);
        return this.update(id, customer);
    }
    deleteCustomer = this.remove
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
    get avatar() { return `./assets/avatar/${(8 * Math.random()) | 0}.png` },
    name: "",
    phone: "",
    address: "",
    remark: "",
    // sex: HUMAN_SEX.NULL,
}