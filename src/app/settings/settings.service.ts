import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';
import { MaterialService, CategoryService } from '../material-manage/material.service'
import { OrderService } from '../order-manage/order.service'
import { CustomerService } from '../customer-manage/customer.service'
import { IndexedDBService } from '../common.service'
@Injectable()
export class SettingsService {
    base_url = "http://localhost:8860/backups/";
    dbs: IndexedDBService[]
    constructor(
        public http: Http,
        public _material_service: MaterialService,
        public _category_service: CategoryService,
        public _order_service: OrderService,
        public _customer_service: CustomerService,
    ) {

        this.dbs = [
            this._material_service,
            this._category_service,
            this._order_service,
            this._customer_service,
        ];
    }

    upload() {
    }
    async backupData() {
        var res = {
            tables: this.dbs.map(db => db.dbname),
            data: {},
            sign: ""
        };
        await Promise.all(this.dbs.map(async db => {
            res.data[db.dbname] = await db.backup()
        }));
        return res;
    }
    async restoreData(dbdata) {
        var tables: string[] = dbdata.tables;
        await Promise.all(tables.map(async dbname => {
            var db = this.dbs.find(db => db.dbname === dbname);
            if (db) {
                await db.restore(dbdata.data[dbname]);
            }
        }));
    }
    formatRespon(res: Response): BackUp[] {
        var res_obj = res.json();
        if (!(res_obj instanceof Array)) {
            res_obj = [res_obj];
        }
        res_obj.forEach(res_item => {
            res_item.create_time && (res_item.create_time = new Date(res_item.create_time));
        });
        return res_obj;
    }
    getList(): Promise<BackUp[]> {
        return this.http.get(this.base_url).toPromise().then(res => {
            return this.formatRespon(res);
        });
    }
    getByKey(key): Promise<string> {
        return this.http.get(this.base_url + "?type=download-url&key=" + encodeURIComponent(key)).toPromise().then(res => res.json());
    }
    removeByKey(key) {
        return this.http.delete(this.base_url + "?key=" + encodeURIComponent(key)).toPromise().then(res => res.json())
    }
}
export interface BackUp {
    key: string,
    hash: string,
    create_time: Date
}