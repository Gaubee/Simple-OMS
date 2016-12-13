import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { CustomerService, Customer, CUSTOMER_DEFAULT, CustomerSearch } from '../../customer-manage/customer.service';
import { copy } from '../../common'

interface CustomerWithWeight extends Customer {
  weight?: number
}

@Component({
  selector: 'app-order-select-customer',
  templateUrl: './order-select-customer.component.html',
  styleUrls: ['./order-select-customer.component.scss']
})
export class OrderSelectCustomerComponent extends CustomerSearch implements OnInit {

  constructor(
    public dialogRef: MdDialogRef<OrderSelectCustomerComponent>
    , public _customer_service: CustomerService
  ) {
    super(_customer_service)
  }
  ngOnInit() {
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