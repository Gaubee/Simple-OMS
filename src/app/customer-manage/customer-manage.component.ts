import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CustomerService, Customer, CUSTOMER_DEFAULT } from './customer.service';
import { OrderService, Order } from '../order-manage/order.service';
import { AppComponent } from '../app.component';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

interface CustomerCard extends Customer {
  has_more?: boolean,
  is_to_remove?: boolean,
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

  show_order_list_number = 3;// 要显示的订单数
  async ngOnInit() {
    // 加载数据
    var customer_list = await this._customer_service.getCustomers(0, 6, { DESC: true });
    this.customer_list = customer_list.map((customer) => {
      var customer_card: CustomerCard = Object.assign({
        has_more: false,
        is_editing: false,
        is_loading_order_list: true,
        order_list: []
      }, customer);
      this.showMoreCustomerOrders(customer_card);
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
    customer.id = res_id;
    customer.is_editing = false;
  }
  is_to_remove: boolean

  async removeCustomer(customer_id, list_index, customer) {
    await this._customer_service.deleteCustomer(customer_id);
    this.customer_list.splice(list_index, 1);

    var snackbarref = this._snackbar.open(`成功删除顾客：${customer.name}`);
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
  }

  showMoreCustomerOrders(customer_card: CustomerCard) {
    this._order_service.getOrdersByFilter((order) => order.customer_id == customer_card.id
      , customer_card.order_list.length
      , this.show_order_list_number + 1
      , {
        DESC: true
      })
      .then(orders => {
        console.log("orders", orders)
        if (orders.length > this.show_order_list_number) {//有更多的订单可以显示
          customer_card.has_more = true;
          orders = orders.slice(0, 3);
        } else {
          customer_card.has_more = false;
        }
        customer_card.is_loading_order_list = false;
        customer_card.order_list = customer_card.order_list.concat(orders);
        // this._change_detector_ref.markForCheck();
      });
  }

  _indexLeftPad(i) {
    var res = String(i);
    if (res.length >= 2) {
      return res;
    } else {
      res = '00' + res;
      return res.substr(-2);
    }
  }
}
