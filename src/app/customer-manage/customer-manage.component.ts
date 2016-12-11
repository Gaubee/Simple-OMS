import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CustomerService, Customer, CUSTOMER_DEFAULT } from './customer.service';
import { OrderService, Order } from '../order-manage/order.service';
import { AppComponent } from '../app.component';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

interface CustomerCard extends Customer {
  is_to_remove?:boolean,
  is_editing?: boolean,
  is_loading_order_list?: boolean,
  order_list?: Order[],
}

@Component({
  selector: 'app-customer-manage',
  templateUrl: './customer-manage.component.html',
  styleUrls: ['./customer-manage.component.scss']
})
export class CustomerManageComponent implements OnInit {
  customer_list: CustomerCard[] = [];
  constructor(
    public _app: AppComponent,
    public _change_detector_ref: ChangeDetectorRef,
    public _customer_service: CustomerService,
    public _order_service: OrderService,
    private _snackbar: MdSnackBar
  ) {

  }

  async ngOnInit() {

    // 加载数据
    var customer_list = await this._customer_service.getCustomers();
    this.customer_list = customer_list.map((customer) => {
      var customer_card = Object.assign({
        is_editing: false,
        is_loading_order_list: true,
        order_list: []
      }, customer);
      this._order_service.getOrdersByFilter((order) => order.customer_id == customer_card.id, 0, 3)
        .then(orders => {
          console.log("orders", orders)
          customer_card.is_loading_order_list = false;
          customer_card.order_list = orders;
          // this._change_detector_ref.markForCheck();
        });
      return customer_card;
    });


    // 面板配置初始化
    const app = this._app;
    app.toolbar_title = "顾客管理";
    app.mixFabButtonDefault({
      enabled: true,
      button_text: "person_add",
      button_tooltip: "添加顾客",
      click_event: () => {
        console.log('add order')
        this.customer_list.push(Object.assign({
          is_editing: true,
          is_loading_order_list: false,
          order_list: []
        }, CUSTOMER_DEFAULT));
      }
    })
  }

  onSubmitCustomer(res_id, list_index, customer: CustomerCard) {
    console.log(arguments)
    customer.is_editing = false;
  }
  is_to_remove: boolean

  async removeCustomer(customer_id, list_index, customer) {
    await this._customer_service.deleteCustomer(customer_id);
    this.customer_list.splice(list_index, 1);

    var snackbarref = this._snackbar.open(`成功删除顾客：${customer.name}`);
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
  }

}
