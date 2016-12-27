import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input, EventEmitter, Output } from '@angular/core';
import { CustomerService, Customer, CUSTOMER_DEFAULT, CustomerSearch } from './customer.service';
import { OrderService, Order } from '../order-manage/order.service';
import { AppComponent } from '../app.component';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { copy } from '../common';

function noop() { };
@Component({
  selector: 'app-customer-manage',
  templateUrl: './customer-manage.component.html',
  styleUrls: ['./customer-manage.component.scss']
})
export class CustomerManageComponent extends CustomerSearch implements OnInit {
  customer_list: Customer[] = [];
  constructor(
    public _app: AppComponent,
    public _router: Router,
    public router: ActivatedRoute,
    public _change_detector_ref: ChangeDetectorRef,
    public _customer_service: CustomerService,
    public _order_service: OrderService,
    private _snackbar: MdSnackBar
  ) {
    super(_customer_service);
  }
  is_loading_list_data: boolean

  is_search_mode = false//是否进入搜索面板
  private _customer_add_callback = noop
  async ngOnInit() {

    // 面板配置初始化
    const app = this._app;
    app.toolbar_title = "客户管理";
    app.mixFabButtonDefault({
      enabled: true,
      button_text: "person_add",
      button_tooltip: "添加客户",
      click_event: () => {
        if (this.customer_list.length && this.customer_list[0].id == undefined) {// 已经是在增加状态了
          return
        }
        var current_show_customer_num = this.show_customer_num;
        // 设置回掉函数
        this._customer_add_callback = () => {
          this.show_customer_num = 3;
          this._customer_add_callback = noop;
          this.customer_list.unshift(Object.assign({ is_editing: true }, CUSTOMER_DEFAULT));
        }
        if (this.loaded_page_index == 0) {
          if (this.customer_list.length >= current_show_customer_num) {
            this.customer_list.pop();
          }
          this._customer_add_callback();
        } else {
          this.show_customer_num = 2;
          this.pageJump(0);
        }

      }
    });

    var icon_buttons = [{
      button_text: "search",
      button_tooltip: "搜索客户",
      click_event: () => {
        this.is_search_mode = !this.is_search_mode;
      }
    }]
    console.log("MIX BUTTon");
    app.mixIconButtons(icon_buttons);

    // 加载数据
    this.router.params.subscribe(async (value) => {
      this.current_page_index = parseInt(value['page']) | 0;
      this.getPages();
      this._customer_add_callback()
    });
  }


  //分页功能
  pages: number[] = [0];
  current_page_index = 0;//当前选中的页号
  loaded_page_index = 0;//已经加载并显示的页号
  show_customer_num = 3;
  private _total_num = -1;
  async getPages(force_get_page_info = false) {
    // 获取分页参数
    if (force_get_page_info || this._total_num == -1) {
      await this.getPagesInfo();
    }
    this.checkPageInfo();
    await this.getPageData();
  }
  async getPagesInfo() {
    var total_num = await this._customer_service.getCustomersCount();
    var page_num = this._total_num = Math.ceil(total_num / this.show_customer_num) || 1;
    this.pages = Array.from<number>({ length: page_num }).map((_, i) => i);
  }
  checkPageInfo() {
    var page_num = this.pages.length;
    if (this.current_page_index >= page_num) {
      this.current_page_index = page_num - 1;
    } else if (this.current_page_index < 0) {
      this.current_page_index = 0;
    }
  }
  async getPageData() {
    this.is_loading_list_data = true;
    var loading_page_index = this.current_page_index;

    const customer_list = await this._customer_service.getCustomers(loading_page_index * this.show_customer_num, this.show_customer_num, { DESC: true });
    this.customer_list = customer_list;

    this.loaded_page_index = loading_page_index;
    this.is_loading_list_data = false;
  }
  pageJump(to_page_index) {
    if (to_page_index !== null) {
      this._router.navigate(['./', { page: to_page_index }]);
    }
  }
  onSubmitCustomer(res, customer_item) {
    console.log(res)
    if (res.is_new) {
      customer_item.id = res.customer_id;//绑定ID
      // 数量变更，刷新分页信息
      this.getPagesInfo();
    }
  }
}


export interface CustomerCard extends Customer {
  has_more?: boolean,
  is_to_remove?: boolean,
  is_editing?: boolean,
  is_loading_order_list?: boolean,
  order_list?: Order[],
}

@Component({
  selector: 'app-customer-card',
  templateUrl: './customer-card.component.html',
  styleUrls: ['./customer-card.component.scss', './customer-manage.component.scss']
})
export class CustomerCardComponent implements OnChanges {
  @Input("customer") customer: Customer
  @Input("edit-model") edit_model: boolean
  customer_item: CustomerCard
  @Output("on-removed") onRemoved = new EventEmitter();
  @Output("on-submit") onSubmit = new EventEmitter();
  constructor(
    public _change_detector_ref: ChangeDetectorRef,
    public _customer_service: CustomerService,
    public _order_service: OrderService,
    private _snackbar: MdSnackBar
  ) { }
  ngOnChanges(changes: SimpleChanges) {
    const customer_change = changes['customer']
    if (customer_change) {
      var customer_card_assign_data = {
        is_editing: false,
        is_loading_order_list: false,
        order_list: []
      }
      const customer = customer_change.currentValue;
      if (!customer) {
        this.customer_item = Object.assign(customer_card_assign_data, CUSTOMER_DEFAULT)
      } else {
        this.customer_item = Object.assign(customer_card_assign_data, customer)
        this.showMoreCustomerOrders();
      }
    }

    const edit_model_change = changes['edit_model']
    if (edit_model_change) {
      this.customer_item.is_editing = edit_model_change.currentValue;
    }
  }

  is_to_remove: boolean
  show_order_list_number = 3;// 要显示的订单数

  async removeCustomer() {
    const customer = this.customer_item;
    const customer_id = customer.id;
    await this._customer_service.deleteCustomer(customer_id);
    // this.customer_list.splice(list_index, 1);
    this.onRemoved.emit(customer);

    var snackbarref = this._snackbar.open(`成功删除客户：${customer.name}`);
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
  }

  showMoreCustomerOrders() {
    const customer_card = this.customer_item;
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
  onSubmitCustomer(res) {
    console.log('inner card', res);
    this.customer_item.id = res.customer_id;
    this.customer_item.is_editing = false;
    this.onSubmit.emit(res);
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