import {
  Component, OnInit, Pipe, PipeTransform,
  QueryList,
  ContentChildren,
  ViewChildren,
  ViewChild,
  AfterContentInit,
  AfterViewInit,
  SimpleChange,
  Inject,
  Directive,
  ElementRef,
  Input,
  Renderer,
} from '@angular/core';
import { AppComponent } from '../app.component';
import { OrderItemComponent } from './order-item/order-item.component';
import { MdDialog, MdDialogRef, MdSnackBar, MdSnackBarConfig } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService, Order, ORDER_DEFAULT } from './order.service';
import { copy } from '../common';
import { Subscription } from 'rxjs/Subscription';
import { OrderSelectCustomerComponent } from './order-select-customer/order-select-customer.component'

@Component({
  selector: 'app-order-manage',
  templateUrl: './order-manage.component.html',
  styleUrls: ['./order-manage.component.scss']
})
export class OrderManageComponent implements OnInit {
  order_list: Order[]
  constructor(
    private _app: AppComponent,
    private _router: Router,
    private _order_service: OrderService
  ) { }

  is_loading_list_data: boolean

  ngOnInit() {
    // 加载数据
    this.is_loading_list_data = true;
    this._order_service.getOrders().then(orders => {
      this.order_list = orders;
      this.is_loading_list_data = false;
    });

    const app = this._app;
    app.toolbar_title = "订单管理";
    app.mixFabButtonDefault({
      enabled: true,
      button_text: "note_add",
      button_tooltip: "添加订单",
      click_event: () => {
        console.log('add order')
        this._router.navigate(["./orders/new"]);
      }
    })
  }

  goEditOrder(order) {
    this._router.navigate(['/orders', order.id]);
  }
  deleteOrder(order) {
    console.log('delete');
  }

}

@Pipe({ name: 'fixed' })
export class FixedPipe implements PipeTransform {
  transform(value, fix_num: number = 2): string {
    return (parseFloat(value) || 0).toFixed(fix_num)
  }
};


@Directive({
  selector: '[focus]'
})
export class FocusDirective {
  @Input()
  focus: boolean;
  constructor(
    @Inject(ElementRef) private element: ElementRef,
    private renderer: Renderer
  ) { }
  protected ngOnChanges(changes) {
    if (changes.focus && changes.focus.currentValue) {
      if (this.element && this.element.nativeElement) {
        // console.log(this.element.nativeElement);
        // var event = new Event('click');
        // this.element.nativeElement.dispatchEvent(event)
        // this.element.nativeElement.focus();
        // this.renderer.invokeElementMethod(this.element.nativeElement, 'click');
      }
    }
  }
}


interface IMyDate {
  year: number;
  month: number;
  day: number;
  toDate(): Date;
}
class OrderEditBase {
  order: Order = copy(ORDER_DEFAULT)
  // is_show_create_time: boolean
  myDatePickerOptions = {
    dayLabels: { su: '周日', mo: '周一', tu: '周二', we: '周三', th: '周四', fr: '周五', sa: '周六' },
    monthLabels: { 1: '1月', 2: '2月', 3: '3月', 4: '4月', 5: '5月', 6: '6月', 7: '7月', 8: '8月', 9: '9月', 10: '10月', 11: '11月', 12: '12月' },
    todayBtnTxt: "今天",
    dateFormat: '订单日期：yyyy-mm-dd',
    // minYear: 1900,
    // showCurrentDay: true,
    editableDateField: false,
  }

  showDate = '';//'订单日期：' + (new Date().toLocaleDateString()).replace(/\//g, '-')

  private _selectedDate: IMyDate = {
    year: 2016, month: 12, day: 12
    , toDate() { return new Date(this.year, this.month - 1, this.day) }
  }//'订单日期：' + (new Date().toLocaleDateString()).replace(/\//g, '-')
  get selectedDate() { return this._selectedDate }
  set selectedDate(new_date: Date | IMyDate) {
    const selectedDate = this._selectedDate;
    if (new_date instanceof Date) {
      selectedDate.year = new_date.getFullYear();
      selectedDate.month = new_date.getMonth() + 1;
      selectedDate.day = new_date.getDate();
    } else if (new_date.hasOwnProperty("year")) {
      selectedDate.year = new_date.year | 0;
      selectedDate.month = new_date.month | 0;
      selectedDate.day = new_date.day | 0;
    } else {
      console.error(new_date, "error format");
    }
    this.showDate = `订单日期：${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`;
  }
  onDateChanged($event) {
    console.log("DATA CHANGED", $event);
    this.selectedDate = $event.date;
    this.order.create_time = this._selectedDate.toDate();
  }

  activeTabIndex = 0;
  constructor() {
    this.selectedDate = new Date();
  }
  public _app: AppComponent
  onChangePro() {
    // if (this.order_data.name && this.order_data.name.trim() && this.material_data.price && this.material_data.price) {
    //   this._app.fab_handle.disabled = false
    // } else {
    this._app.fab_handle.disabled = true;
    // }
  }

  addOrderNode() {
    console.log("add order node");
    this.order.nodes.push({
      size_list: []
    });
  }
  setOrderPrice(v) {
    this.order.order_price = v;
  }
  computeOrderPrice() {
    this.setOrderPrice(this.order.nodes.reduce((v, node) => node.total_price + v, 0));
  }

  public dialog: MdDialog
  customer_select_dialog: MdDialogRef<OrderSelectCustomerComponent>
  openCustomerSelectDialog() {
    console.log("OPEN!!")
    this.customer_select_dialog = this.dialog.open(OrderSelectCustomerComponent, {
      disableClose: true
    });

    this.customer_select_dialog.afterClosed().subscribe(result => {
      console.log('result: ' + result);
      this.customer_select_dialog = null;
    });
  }
}


@Component({
  selector: 'app-order-add',
  templateUrl: './order-edit.component.html',
  styleUrls: ['./order-edit.component.scss'],
})
export class OrderAddComponent extends OrderEditBase implements OnInit, AfterViewInit {

  constructor(
    public _app: AppComponent,
    private _order_service: OrderService,
    private _snackbar: MdSnackBar,
    public ref: ElementRef,
    public dialog: MdDialog
  ) {
    super();
  }

  ngOnInit() {
    const app = this._app;
    app.toolbar_title = "新建订单";
    app.mixFabButtonDefault({
      enabled: true,
      button_text: "check",
      button_tooltip: "提交新订单",
      click_event: async () => {
        console.log("post order");
        await this._order_service.addOrder(this.order);
        var snackbarref = this._snackbar.open("添加完成");
        setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
        this.order = copy(ORDER_DEFAULT);// 重置清空
        this.activeTabIndex = 0;
      }
    });
  }
  ngAfterViewInit() {
  }
}
@Component({
  selector: 'app-order-update',
  templateUrl: './order-edit.component.html',
  styleUrls: ['./order-edit.component.scss']
})
export class OrderUpdateComponent extends OrderEditBase implements OnInit {

  constructor(
    public _app: AppComponent,
    private route: ActivatedRoute,
    private _snackbar: MdSnackBar,
    private _order_service: OrderService,
    public dialog: MdDialog
  ) {
    super();
  }
  cur_order_id: string;
  is_loaded_cur_order_data: boolean
  ngOnInit() {
    const app = this._app;
    app.toolbar_title = "修改订单";
    app.mixFabButtonDefault({
      enabled: true,
      button_text: "check",
      button_tooltip: "提交修改",
      click_event: async () => {
        console.log("put order");
        await this._order_service.updateOrder(this.cur_order_id, this.order);
        var snackbarref = this._snackbar.open("修改完成");
        setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
        // app.fab_handle.disabled = true;
      }
    });

    // 获取要修改的数据
    this.cur_order_id = this.route.params['value']['id'];
    this.is_loaded_cur_order_data = false;
    app.mixLoadingBarDefault({ show: true });// 显示加载栏
    this._order_service.getOrderById(this.cur_order_id).then(order => {
      this.order = order;
      this.selectedDate = order.create_time;// 日期绑定
      this.is_loaded_cur_order_data = true;
      app.loading_bar.show = false;// 隐藏加载栏
    });
  }
}