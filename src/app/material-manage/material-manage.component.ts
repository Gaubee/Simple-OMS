import {
    Component, OnInit, OnChanges, NgModule, ElementRef, ViewChild, SimpleChanges,
    Input, Output, EventEmitter
} from '@angular/core';
import { AppComponent } from '../app.component';
import {
    MdDialog, MdDialogRef
    , MdSnackBar, MdSnackBarConfig
} from '@angular/material';

import { Router, ActivatedRoute } from '@angular/router';
import {
    MaterialService, Material, MATERIAL_DEFAULT, MaterialSerch
    , Category, CATEGORY_DEFAULT, CategorySerch, CategoryService
} from './material.service';
import { mix_options, copy } from '../common'
import { CommonDialogComponent } from '../common-dialog/common-dialog.component'

@Component({
    selector: 'app-material-manage',
    templateUrl: './material-manage.component.html',
    styleUrls: ['./material-manage.component.scss'],
    providers: []
})
export class MaterialManageComponent {
    material_list: Material[]
    constructor(
        private _app: AppComponent,
        private _router: Router,
        private _material_service: MaterialService
    ) { }
    selected_category: Category
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

interface CategoryEditAble extends Category {
    is_editing: boolean,
    editing_name?: string,
    is_selected?: boolean
}
@Component({
    selector: 'app-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./material-manage.component.scss'],
})
export class CategoryListComponent extends CategorySerch implements OnInit {
    constructor(
        public _category_service: CategoryService,
        public _snack_bar: MdSnackBar,
        public dialog: MdDialog
    ) {
        super(_category_service)
    }
    @Output('on-view-detail-category') onViewDetailCategory = new EventEmitter()
    category_list: CategoryEditAble[]
    is_loading_list_data: boolean
    show_category_num = Infinity;
    ngOnInit() {
        this._getData();
    }
    private async _getData() {
        this.is_loading_list_data = true;
        const categorys = await this._category_service.getCategorys(0, this.show_category_num, {
            DESC: true
        })

        this.category_list = categorys.map(category => Object.assign({
            is_editing: false
        }, category));
        this.is_loading_list_data = false;
        // 重置选中项
        this.selected_num = 0;
        this.is_select_all = false;
    }
    addNewCategory() {
        this.category_list.unshift(Object.assign({
            is_editing: true,
            editing_name: ""
        }, CATEGORY_DEFAULT));
    }
    editCategory(category: CategoryEditAble) {
        if (!category.editing_name || !category.editing_name.trim()) {
            category.editing_name = category.name
        };
        category.is_editing = true;
    }
    cancelEditCategory(category: CategoryEditAble, list_index: number) {
        if (category.id) {
            category.is_editing = false;
        } else {
            this.category_list.splice(list_index, 1);
        }
    }
    async submitCategoryData(category: CategoryEditAble) {
        category.name = category.editing_name;
        if (category.id) {
            var snack_bar_msg = "修改完成"
            await this._category_service.updateCategory(category.id, category);
        } else {//新增
            var snack_bar_msg = "增加成功"
            category.id = String(await this._category_service.addCategory(category));
        }
        category.is_editing = false;
        var snack_bar_ref = this._snack_bar.open(snack_bar_msg);
        setTimeout(() => snack_bar_ref.dismiss(), 2000);
    }
    public common_dialog: MdDialogRef<CommonDialogComponent>
    removeSelectedCategory() {
        const selected_categorys = this.category_list.filter(category => category.is_selected);
        this.common_dialog = this.dialog.open(CommonDialogComponent, { disableClose: true });
        this.common_dialog.afterClosed().subscribe(async result => {
            this.common_dialog = null;
            if (result) {
                this.is_loading_list_data = true;
                await selected_categorys.map(category => this._category_service.deleteCategory(category.id));
                this.is_loading_list_data = false;
                this._getData();
            }
        });
        const dialog_component = this.common_dialog.componentInstance;
        dialog_component.dialog_content = `确认删除选中的${selected_categorys.length}项类目以及所属的材料？`;
        console.log('remove categorys', selected_categorys.map(category => category.name))
    }
    /** 选择删除功能*/

    is_select_all = false
    toggleSelectAll() {
        if (this.is_select_all) {//反选
            this.category_list.forEach(category => {
                category.is_selected = true
            })
            this.selected_num = this.category_list.length;
        } else {//全选
            this.category_list.forEach(category => {
                category.is_selected = false
            })
            this.selected_num = 0;
        }
    }
    // 已选中的元素数量
    selected_num = 0;
    // 选中删除功能
    itemSelected(category: CategoryEditAble, list_index) {
        if (category.is_selected) {
            this.selected_num += 1;
        } else {
            this.selected_num -= 1;
        }
        this.is_select_all = this.selected_num === this.category_list.length
    }
}

interface MaterialEditAble extends Material {
    is_editing: boolean,
    editing_name?: string,
    editing_price?: number,
    is_selected?: boolean
}
@Component({
    selector: 'app-category-material-list',
    templateUrl: './category-material-list.component.html',
    styleUrls: ['./material-manage.component.scss'],
})
export class CategoryMaterialListComponent extends MaterialSerch implements OnChanges {
    constructor(
        public _material_service: MaterialService,
        public _snack_bar: MdSnackBar,
        public dialog: MdDialog
    ) {
        super(_material_service)
    }
    @Input() category: Category;
    material_list: MaterialEditAble[]
    is_loading_list_data: boolean
    show_material_num = Infinity;
    has_more = false; //是否有更多的数据可以显示
    ngOnChanges(changes: SimpleChanges) {
        var category_change = changes["category"];
        if (category_change) {
            const category: Category = category_change.currentValue;
            this.is_loading_list_data = true;
            this.material_list = []// 清空数据
            this._getData();
        }
    }
    private _getData() {
        this.is_loading_list_data = true;
        this._material_service.getMaterialsByCategoryId(this.category.id, this.material_list.length, this.show_material_num + 1).then(materials => {
            this.has_more = materials.length > this.show_material_num;
            // this.material_list = materials.slice(0, this.show_material_num);
            this.material_list = materials.slice(0, this.show_material_num).map(material => {
                return Object.assign({
                    is_editing: false,
                }, material);
            });
            this.is_loading_list_data = false;
        });
        // 重置多选功能
        this.selected_num = 0;
        this.is_select_all = false;
    }
    showMore() {
        this._getData();
    }
    addNewMaterial() {
        this.material_list.unshift(Object.assign({
            is_editing: true,
            editing_name: "",
            editing_price: 0
        }, MATERIAL_DEFAULT))
    }
    editMaterial(material: MaterialEditAble) {
        if (!material.editing_name || !material.editing_name.trim()) {
            material.editing_name = material.name
        };
        if (!material.editing_price) {
            material.editing_price = material.price;
        }
        material.is_editing = true;
    }
    cancelEditMaterial(material: MaterialEditAble, list_index: number) {
        if (material.id) {
            material.is_editing = false;
        } else {
            this.material_list.splice(list_index, 1);
        }
    }
    async submitMaterialData(material: MaterialEditAble) {
        material.name = material.editing_name;
        material.price = material.editing_price;
        material.category_id = this.category.id;
        if (material.id) {
            var snack_bar_msg = "修改完成"
            await this._material_service.updateMaterial(material.id, material);
        } else {//新增
            var snack_bar_msg = "增加成功"
            material.id = String(await this._material_service.addMaterial(material));
        }
        material.is_editing = false;
        var snack_bar_ref = this._snack_bar.open(snack_bar_msg);
        setTimeout(() => snack_bar_ref.dismiss(), 2000);
    }

    public common_dialog: MdDialogRef<CommonDialogComponent>
    removeSelectedMaterial() {
        const selected_materials = this.material_list.filter(material => material.is_selected);
        this.common_dialog = this.dialog.open(CommonDialogComponent, { disableClose: true });
        this.common_dialog.afterClosed().subscribe(async result => {
            this.common_dialog = null;
            if (result) {
                this.is_loading_list_data = true;
                await selected_materials.map(material => this._material_service.deleteMaterial(material.id));
                this.is_loading_list_data = false;
                this._getData();
            }
        });
        const dialog_component = this.common_dialog.componentInstance;
        dialog_component.dialog_content = `确认删除选中的${selected_materials.length}项材料？`;
        dialog_component.dialog_subtitle = `相关的订单不会被删除。`;
        console.log('remove materials', selected_materials.map(material => material.name))
    }
    /** 选择删除功能*/

    is_select_all = false
    toggleSelectAll() {
        if (this.is_select_all) {//反选
            this.material_list.forEach(material => {
                material.is_selected = true
            })
            this.selected_num = this.material_list.length;
        } else {//全选
            this.material_list.forEach(material => {
                material.is_selected = false
            })
            this.selected_num = 0;
        }
    }
    // 已选中的元素数量
    selected_num = 0;
    // 选中删除功能
    itemSelected(material: MaterialEditAble, list_index) {
        if (material.is_selected) {
            this.selected_num += 1;
        } else {
            this.selected_num -= 1;
        }
        this.is_select_all = this.selected_num === this.material_list.length
    }
}
@Component({
    selector: 'app-material-list',
    templateUrl: './material-list.component.html',
    styleUrls: ['./material-manage.component.scss'],
})
export class MaterialListComponent extends MaterialSerch implements OnInit {
    constructor(
        public _material_service: MaterialService
    ) {
        super(_material_service)
    }
    material_list: Material[]
    is_loading_list_data: boolean
    show_material_num = Infinity;
    ngOnInit() {
        this.is_loading_list_data = true;
        this._material_service.getMaterials().then(materials => {
            this.material_list = materials;
            this.is_loading_list_data = false;
        })
    }
}