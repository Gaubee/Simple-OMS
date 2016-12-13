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
// 搜索功能拓展类

export interface CustomerWithWeight extends Customer {
    weight?: number
}
export class CustomerSearch {
    constructor(
        public _customer_service: CustomerService
    ) { }

    selected_customer_id: string
    search_text = "";
    search_list: CustomerWithWeight[] = [];
    show_search_list_num = 3;// 显示10个
    is_search_able = false;
    is_searching = false;
    currrent_dynamic_configuration: any = {}
    search_progress = 0;
    async searchCustomer() {
        var search_text = this.search_text.trim();
        // 中断上一次搜索
        this.currrent_dynamic_configuration.is_stop = true;
        // 重置新的搜索配置
        this.currrent_dynamic_configuration = {};
        // 清空数据
        this.search_list = [];
        if (search_text) {
            this.search_progress = 0;//重置进度条
            this.is_search_able = true;
            this.is_searching = true;
            var weight_list = [];
            var total_count = await this._customer_service.getCustomersCount();
            var _search_progress = 0;
            await this._customer_service.getCustomersByFilter((customer) => {
                var weight = CustomerSearch.getSearchWeight(customer.name, search_text) + CustomerSearch.getSearchWeight(customer.phone, search_text);
                if (weight) {
                    this.search_list.push(Object.assign({
                        weight: weight
                    }, customer));
                    this.search_list.sort((customer_a, customer_b) => customer_b.weight - customer_a.weight);
                    if (this.search_list.length > this.show_search_list_num) {
                        this.search_list.length = this.show_search_list_num
                    }
                }
                _search_progress += 1;
                this.search_progress = _search_progress / total_count * 100;
                console.log(_search_progress, total_count,this.search_progress );
                return weight > 0;
            }, 0, total_count, this.currrent_dynamic_configuration)
            this.is_searching = false;
        } else {
            this.is_search_able = false;
        }
    }
    static getSearchWeight(source_text: string, search_text: string) {
        var weight = 0;
        var mul_match_score = 0;// 连续匹配的分数
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
