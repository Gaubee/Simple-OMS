import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CustomerService, Customer, CUSTOMER_DEFAULT, HUMAN_SEX } from '../customer.service';
import { copy } from '../../common';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss', '../customer-manage.component.scss']
})
export class CustomerEditComponent implements OnInit {
  @Input() title = "";
  @Input() customer: Customer = copy(CUSTOMER_DEFAULT);
  @Output('on-submit') onSubmit = new EventEmitter<Customer>();
  sex_enum = HUMAN_SEX
  constructor(
    public _customer_service: CustomerService,
    private _snackbar: MdSnackBar

  ) { }

  ngOnInit() {
  }
  is_uploading: boolean
  async submitCustomer() {
    const customer = this.customer;
    this.is_uploading = true;
    if (customer.id) {
      var res_id = await this._customer_service.updateCustomer(customer.id, customer)
      var snackbar_msg = "修改完成"
    } else {
      var res_id = await this._customer_service.addCustomer(customer)
      var snackbar_msg = "添加成功"
    }
    this.is_uploading = false;
    var snackbarref = this._snackbar.open(snackbar_msg);
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
    this.onSubmit.emit(res_id);
  }

}