import { Injectable } from '@angular/core';

export interface Material {
    id?: string,
    name: string,
    price: number,
    create_time?: Date
}

export const MATERIALS: Material[] = [
    { id: "1", name: "红金龙", price: 100, create_time: new Date('2016-10-10') },
    { id: "2", name: "红ZZ", price: 200, create_time: new Date('2016-10-8') },
    { id: "3", name: "红色人工石", price: 300, create_time: new Date('2016-10-3') },
];

@Injectable()
export class MaterialService {
    getMaterials(): Promise<Material[]> {
        // return Promise.resolve(MATERIALS);
        return new Promise((reslove, reject) => {
            setTimeout(() => {
                reslove(MATERIALS)
            }, 3000 * Math.random());
        });
    }
    getMaterialById(id): Promise<Material> {
        return new Promise((reslove, reject) => {
            setTimeout(() => {
                if (
                    MATERIALS.some(material => {
                        if (material.id == id) {
                            reslove(material);
                            return true;
                        }
                    })
                ) {
                    reject("material no found:" + id);
                }
            }, 1000 * Math.random());
        });
    }
    addMaterial(new_material: Material): Promise<Material> {
        new_material.id = (~~MATERIALS[MATERIALS.length - 1].id + 1).toString();
        new_material.create_time = new Date;
        MATERIALS.push(new_material);
        return Promise.resolve(new_material);
    }
    async updateMaterial(id, material: Material): Promise<Material>  {
        var cur_material = await this.getMaterialById(id);
        cur_material.name = material.name;
        cur_material.price = material.price;
        return cur_material;
    }
}