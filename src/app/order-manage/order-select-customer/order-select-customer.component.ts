import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { CustomerService, Customer, CUSTOMER_DEFAULT } from '../../customer-manage/customer.service';
import { copy } from '../../common'

interface CustomerWithWeight extends Customer {
  weight?: number
}

@Component({
  selector: 'app-order-select-customer',
  templateUrl: './order-select-customer.component.html',
  styleUrls: ['./order-select-customer.component.scss']
})
export class OrderSelectCustomerComponent implements OnInit {

  constructor(
    public dialogRef: MdDialogRef<OrderSelectCustomerComponent>
    , public _customer_service: CustomerService
  ) { }
  ngOnInit() {
  }
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
      this.is_search_able = true;
      this.is_searching = true;
      var weight_list = [];
      var total_count = await this._customer_service.getCustomersCount();
      var _search_progress = 0;
      await this._customer_service.getCustomersByFilter((customer) => {
        var weight = getSearchWeight(customer.name, search_text) + getSearchWeight(customer.phone, search_text);
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
        return weight > 0;
      }, 0, total_count, this.currrent_dynamic_configuration)
      this.is_searching = false;
      this.search_progress = 0;//重置进度条
    } else {
      this.is_search_able = false;
    }
  }
  private _new_customer = copy(CUSTOMER_DEFAULT);// 新建用户时的编辑备份
  cur_customer = this._new_customer
  toNewCustomer() {
    this.selected_customer_id = null;
    this.cur_customer = this._new_customer;
  }
  onNewCustomer(new_customer_id) {
    this.selected_customer_id = new_customer_id;
    this._new_customer = copy(CUSTOMER_DEFAULT);
  }
  async selecteCustomer() {
    this.cur_customer = await this._customer_service.getCustomerById(this.selected_customer_id);
  }
}

function getSearchWeight(source_text: string, search_text: string) {
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