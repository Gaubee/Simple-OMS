import { Component, OnInit } from '@angular/core';
import { AppComponent } from "../app.component";
import { SettingsService, BackUp } from "./settings.service";
import { Http, Response } from '@angular/http';
import { MdDialog, MdDialogRef, MdSnackBar, MdSnackBarConfig } from '@angular/material';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(private _app: AppComponent,
    private _snackbar: MdSnackBar,
    public _setting_service: SettingsService,
    public _http: Http
  ) { }

  selected_backup_hash = ""
  cur_backup: BackUp
  backup_list: BackUp[] = []
  ngOnInit() {
    const app = this._app;
    const fab_handle = app.fab_handle;

    app.toolbar_title = "设置中心";
    fab_handle.enabled = false;

    this.getBackupData();
  }
  async getBackupData() {
    this.show_loading = true;

    this.backup_list = await this._setting_service.getList();
    this.show_loading = false;
  }
  selecteBackup() {
    this.backup_list.some(backup => {
      if (backup.hash === this.selected_backup_hash) {
        this.cur_backup = backup;
        return true;
      }
    })
  }
  show_loading = false;
  async backupData() {
    this.show_loading = true;
    var all_data = await this._setting_service.backupData();
    console.log("all_data", all_data);
    var blob = new Blob([JSON.stringify(all_data)], {
      type: 'text/json'
    });
    var formData = new FormData();
    formData.append("db", blob);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", this._setting_service.base_url);
    xhr.send(formData);
    xhr.onload = () => {
      var snackbarref = this._snackbar.open("备份完成");
      setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
      this.getBackupData()
      this.show_loading = false;
    };
  }
  async restoreDB() {
    this.show_loading = true;

    var db = await this._setting_service.getByKey(this.cur_backup.key);
    await this._setting_service.restoreData(db);
    // console.log('restore success', db)
    var snackbarref = this._snackbar.open("成功还原备份数据");
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
    this.show_loading = false;
  }
  async removeBackup(key) {
    this.show_loading = true;
    var res = await this._setting_service.removeByKey(key);
    // console.log("remove success", res);
    var snackbarref = this._snackbar.open("数据删除成功");
    setTimeout(() => snackbarref.dismiss(), 2000);// 定时关闭
    this.getBackupData();
    this.show_loading = false;

  }
}
