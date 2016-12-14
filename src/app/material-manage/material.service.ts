import { Injectable } from '@angular/core';
import { IndexedDBService, DynamicConfiguration, CommonSearch } from '../common.service';
import { mix_options, copy } from '../common'

export interface Material {
    id?: string,
    name?: string,
    remark?: string,
    price?: number,
    category_id?: string,
    category?: Category,
    create_time?: Date
}
export interface Category {
    id?: string,
    create_time?: Date,
    name?: string,
    remark?: string,
}

export const MATERIAL_DEFAULT: Material = {
    id: "",
    name: "",
    remark: "",
    price: 0,
    category_id: "",
    category: null,
    get create_time() { return new Date },
}
export const CATEGORY_DEFAULT: Category = {
    id: "",
    name: "",
    remark: "",
    get create_time() { return new Date },
}

export const MATERIALS: Material[] = [
    { id: "1", name: "红金龙", price: 100, create_time: new Date('2016-10-10') },
    { id: "2", name: "红ZZ", price: 200, create_time: new Date('2016-10-8') },
    { id: "3", name: "红色人工石", price: 300, create_time: new Date('2016-10-3') },
];

@Injectable()
export class MaterialService extends IndexedDBService {
    constructor() {
        super('material');
    }
    db: Promise<IDBDatabase>;

    getMaterialsCount = this.getCount

    getMaterials(start_index = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Material[]> {
        return this.getList<Material>(start_index, num, dynamic_configuration);
    }

    getMaterialsByFilter(filter: (material: Material) => boolean, before_num = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Material[]> {
        return this.getListByFilter<Material>(filter, before_num, num, dynamic_configuration);
    }

    getMaterialById(id): Promise<Material> {
        return this.getById<Material>(id)
    }

    addMaterial(new_material: Material): Promise<number> {
        new_material = mix_options(copy(MATERIAL_DEFAULT), new_material);
        return this.add(new_material);
    }
    updateMaterial(id, material: Material): Promise<number> {
        material = mix_options(copy(MATERIAL_DEFAULT), material);
        return this.update(id, material);
    }
    deleteMaterial = this.remove

    getMaterialsByCategoryId(category_id, before_num = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration) {
        return this.getListByFilter<Material>((material) => material.category_id == category_id, before_num, num, dynamic_configuration);
    }
}

@Injectable()
export class CategoryService extends IndexedDBService {
    constructor(
        public _material_srevice: MaterialService
    ) {
        super("category")
    }
    db: Promise<IDBDatabase>;

    getCategorysCount = this.getCount

    getCategorys(start_index = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Category[]> {
        return this.getList<Category>(start_index, num, dynamic_configuration);
    }

    getCategorysByFilter(filter: (category: Category) => boolean, before_num = 0, num = 10
        , dynamic_configuration?: DynamicConfiguration): Promise<Category[]> {
        return this.getListByFilter<Category>(filter, before_num, num, dynamic_configuration);
    }

    getCategoryById(id): Promise<Category> {
        return this.getById<Category>(id)
    }

    addCategory(new_category: Category): Promise<number> {
        new_category = mix_options(copy(CATEGORY_DEFAULT), new_category);
        return this.add(new_category);
    }
    updateCategory(id, category: Category): Promise<number> {
        category = mix_options(copy(CATEGORY_DEFAULT), category);
        return this.update(id, category);
    }
    async deleteCategory(id) {
        const own_materials = await this._material_srevice.getMaterialsByCategoryId(id, 0, Infinity);
        await own_materials.map(material => this._material_srevice.deleteMaterial(material.id));
        await this.remove(id);
    }
}

export class MaterialSerch extends CommonSearch<Material> {
    constructor(
        public _material_service: MaterialService
    ) {
        super(_material_service, ["name"])
    }
}

export class CategorySerch extends CommonSearch<Category> {
    constructor(
        public _category_service: CategoryService
    ) {
        super(_category_service, ["name"])
    }
}