import {
  Component,
  OnInit,
  OnChanges,
  Input,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectionStrategy,
  SimpleChange,
  SimpleChanges,
  EventEmitter,
  Output,
  ContentChildren,
  QueryList,
  ViewChildren,
  ChangeDetectorRef,
} from '@angular/core';
import { copy } from '../../common';
import { Type, OrderService, Size, OrderNode, SIZE_DEFAULT } from '../order.service';
import {
  MaterialService, Material
  , Category, CategoryService
} from '../../material-manage/material.service';
import { Subject, Observable, Subscription } from 'rxjs';
import {
  MdSnackBar, MdSnackBarConfig
} from '@angular/material';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.css']
})
export class OrderItemComponent implements OnInit, OnChanges {
  type_options: Category[] = [];
  material_options: Material[] = [];
  @Input('order-node') order_node: OrderNode// = { size_list: [copy(SIZE_DEFAULT)] }
  @Input('is-safe-lock') is_safe_lock: boolean
  ob_type_id = new Subject();
  ob_material_id = new Subject();

  @Output('on-total-price-change') onTotalPriceChange = new EventEmitter();

  addSizeItem() {
    this.order_node.size_list.push(copy(SIZE_DEFAULT));
  }
  removeSizeItem(i) {
    this.order_node.size_list.splice(i, 1);
  }

  @Input() focus: boolean;

  constructor(
    public _order_service: OrderService,
    public _material_service: MaterialService,
    public _category_service: CategoryService,
    public _change_detector_ref: ChangeDetectorRef,
    public _snack_bar: MdSnackBar
  ) { }
  is_loading_type_list: boolean
  is_loading_material_list: boolean

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('order_node')) {
      var new_order_node: OrderNode = changes["order_node"].currentValue;
    }
    if (changes.hasOwnProperty('is_safe_lock')) {
      if (!this.is_lock()) {
        if (this.type_options && this.type_options.length) {
          this.setObTypeId()
        } else {
          this.is_loading_type_list = true;
          this._category_service.getCategorys(0, Infinity).then(types => {
            this.is_loading_type_list = false;

            this.type_options = types
            this.setObTypeId()
          });
        }
      }
    }
  }
  is_lock() {
    const order_node = this.order_node;
    return this.is_safe_lock && order_node && order_node.material;
  }
  setObTypeId(id = this.order_node.type_id) {
    if (id && this.type_options && this.type_options.length) {
      this.ob_type_id.next(id);
    }
  }
  setObMaterialId(id = this.order_node.material_id) {
    if (id && this.material_options && this.material_options.length) {
      this.ob_material_id.next(id);
    }
  }

  ngOnInit() {
    // 重新计算面积
    this.order_node.size_list.forEach((_, i) => this.computeSizeArea(i));
    // 获取引用对象详细数据
    this.ob_type_id.subscribe(async (type_id: string) => {
      console.log("type_id:", type_id)
      this.order_node.type_id = type_id;
      this.order_node.type = await this._category_service.getCategoryById(type_id);
      setTimeout(_ => this._change_detector_ref.markForCheck());// 列表更新，手动触发重绘

      this.is_loading_material_list = true;
      this._material_service.getMaterialsByCategoryId(type_id, 0, Infinity).then(materials => {
        this.is_loading_material_list = false;
        this.material_options = materials;
        // 材料选项重置
        if (this.order_node && this.order_node.material_id) {
          if (!materials.some(material => material.id == this.order_node.material_id)) {
            this.order_node.material = null;
            this.order_node.material_id = null;
          }
        }
        this.setObMaterialId();
        if (!materials.length) {
          var snack_bar_ref = this._snack_bar.open("指定类目无可选材料，请到“材料管理”中添加");
          setTimeout(() => snack_bar_ref.dismiss(), 8000);
        }
      });
    });
    this.ob_material_id.subscribe(async (material_id: string) => {
      console.log("material_id:", material_id)
      this.order_node.material_id = material_id;
      this.order_node.material = await this._material_service.getMaterialById(material_id);
      setTimeout(_ => this._change_detector_ref.markForCheck());// 列表更新，手动触发重绘
      this.computeTotalPrice();
    });
  }
  ngAfterViewInit() {
    // 修复OnPush视图更新模式在初始化的时候不初始化视图的BUG
    setTimeout(_ => this._change_detector_ref.markForCheck());
  }

  computeSizeArea(size_list_index: number) {
    var size = this.order_node.size_list[size_list_index];
    var area = size.area = size.width * size.height;
    this.computeTotalPrice();
    return area;
  }

  computeTotalPrice() {
    const order_node = this.order_node;
    var material = order_node.material
    var total_price = parseFloat(order_node.machining_price + "") || 0;
    if (material) {
      total_price += order_node.size_list.reduce((v, size) => v + size.area * material.price, 0);
    }
    if (order_node.total_price !== total_price) {
      var old_value = order_node.total_price;
      order_node.total_price = total_price;
      this.onTotalPriceChange.emit(new SimpleChange(old_value, total_price));
    }
  }
}

@Component({
  selector: 'app-order-item-list',
  // 
  template: `<ng-content></ng-content>{{order_price}}`,

})
export class OrderItemListComponent {
  @Output() onOrderPriceChange = new EventEmitter();

  @ContentChildren(OrderItemComponent) orderItems: QueryList<OrderItemComponent>;


  order_price = 0;
  computeOrderPrice() {
    var order_price = 0;
    if (this.orderItems) {
      order_price += this.orderItems.reduce((v, orderItem) => orderItem.order_node.total_price + v, 0);
    }
    if (order_price !== this.order_price) {
      this.order_price = order_price;
      this.onOrderPriceChange.emit(order_price);
    }
    return order_price;
  }

  // @ContentChildren(OrderItemComponent) orderItems: QueryList<OrderItemComponent>;
  ngAfterContentInit() {
    console.log('orderItems', this.orderItems);
    this._resetOrderItems();
    this._changeSubscription = this.orderItems.changes.subscribe(_ => {
      this._resetOrderItems()
    })
  }
  ngOnDestroy() {
    this._dropSubscriptions();
    this._changeSubscription.unsubscribe();
  }
  /** Subscriptions to order-item events. */
  private _subscriptions: Subscription[] = [];
  private _changeSubscription: Subscription

  // 重置监听
  private _resetOrderItems() {
    this._dropSubscriptions();
    this._listenToOrderItems();
    this.computeOrderPrice();
  }

  /** 开始监听所有的子订单的价格变动 */
  private _listenToOrderItems(): void {
    this.orderItems.forEach((orderItem: OrderItemComponent) => {
      const sub = orderItem.onTotalPriceChange.subscribe((change_value: SimpleChange) => {
        this.computeOrderPrice();
      });
      this._subscriptions.push(sub);
    });
  }

  /** 结束监听所有的子订单的价格变动 */
  private _dropSubscriptions(): void {
    this._subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this._subscriptions = [];
  }

}