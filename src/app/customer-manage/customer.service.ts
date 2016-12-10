import { Injectable } from '@angular/core';

const CUSTOMERS: Customer[] = [

]

@Injectable()
export class CustomerService {

    constructor() { }
    async getOrders() {
        return CUSTOMERS
    }
    async getOrderById(id) {
        var res: Customer
        CUSTOMERS.some(customer => {
            if (customer.id == id) {
                res = customer;
                return true;
            }
        });
        if (!res) {
            throw new ReferenceError("customer no found:" + id);
        }
        return res;
    }
}

export interface Customer {
    id?: string,
    name?: string,
    phone?: string,
    address?: string,
    remark?: string
}