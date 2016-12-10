import {
  Component, OnInit, OnChanges, NgModule, ElementRef, ViewChild, SimpleChanges
} from '@angular/core';
import { AppComponent } from '../app.component';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';

import { Router, ActivatedRoute } from '@angular/router';
import { MaterialService, Material } from './material.service';

@Component({
  selector: 'app-material-manage',
  templateUrl: './material-manage.component.html',
  styleUrls: ['./material-manage.component.scss'],
  providers: []
})
export class MaterialManageComponent implements OnInit {
  material_list: Material[]
  constructor(
    private _app: AppComponent,
    private _router: Router,
    private _material_service: MaterialService
  ) { }
  is_loading_list_data: boolean;
  ngOnInit() {
    const app = this._app;
    //数据拉取
    this.is_loading_list_data = true;
    this._material_service.getMaterials().then((material_list) => {
      this.material_list = material_list;
      this.is_loading_list_data = false;
    });
    // 标题
    app.toolbar_title = "材料管理";
    // 浮动按钮
    app.mixFabButtonDefault({
      enabled: true,
      click_event: () => {
        console.log("add material");
        this._router.navigate(['/materials/new']);
      },
      button_text: "add",
      button_tooltip: "添加材料"
    });

  }
  goEdit(material: Material) {
    this._router.navigate(['/materials', material.id]);
  }
  delMat(material: Material) {
    console.log(`delete material ${material}`);
  }
}

class MaterialEditBase {
  material_data: Material = {
    name: "",
    price: 0
  }
  public _app: AppComponent
  onChangePro() {
    if (this.material_data.name && this.material_data.name.trim() && this.material_data.price && this.material_data.price) {
      this._app.fab_handle.disabled = false
    } else {
      this._app.fab_handle.disabled = true;
    }
  }
}

@Component({
  selector: 'app-material-add',
  templateUrl: './material-edit.component.html',
  styleUrls: ['./material-edit.component.scss'],
})
export class MaterialAddComponent extends MaterialEditBase implements OnInit {

  constructor(
    public _app: AppComponent,
    private _router: Router,
    private _material_service: MaterialService,
    private _snackbar: MdSnackBar
  ) {
    super();
  }
  ngOnInit() {
    const app = this._app;
    app.toolbar_title = "添加材料";
    app.mixFabButtonDefault({
      disabled: true,
      enabled: true,
      button_text: "check",
      button_tooltip: "提交新材料",
      click_event: () => {
        this._material_service.addMaterial(this.material_data)
          .then(() => this._snackbar.open("添加成功", ''));
        // 数据重置
        this.material_data.name = "";
        this.material_data.price = 0;
        app.fab_handle.disabled = true;
      }
    });
  }
}

@Component({
  selector: 'app-material-update',
  templateUrl: './material-edit.component.html',
  styleUrls: ['./material-edit.component.scss'],
})
export class MaterialUpdateComponent extends MaterialEditBase implements OnInit {

  constructor(
    public _app: AppComponent,
    public route: ActivatedRoute,
    private _material_service: MaterialService,
    private _snackbar: MdSnackBar
  ) {
    super();
  }
  cur_material_id: string;
  is_loaded_cur_material_data: boolean;
  ngOnInit() {
    const app = this._app;
    app.toolbar_title = "修改材料";

    app.mixFabButtonDefault({
      disabled: true,
      enabled: true,
      button_text: "check",
      button_tooltip: "提交修改",
      click_event: () => {
        this._material_service.updateMaterial(this.cur_material_id, this.material_data)
          .then(() => this._snackbar.open("修改完成", ''));
        app.fab_handle.disabled = true;
      }
    });
    // 获取要修改的数据
    this.cur_material_id = this.route.params['value']['id'];
    this.is_loaded_cur_material_data = false;
    app.mixLoadingBarDefault({ show: true });// 显示加载栏
    this._material_service.getMaterialById(this.cur_material_id).then(material => {
      this.material_data = material;
      this.is_loaded_cur_material_data = true;
      app.loading_bar.show = false;// 隐藏加载栏
    });
  }
  onChangePro() {
    if (!this.is_loaded_cur_material_data) {
      this._app.fab_handle.disabled = true;
    } else {
      super.onChangePro();
    }
  }
}
