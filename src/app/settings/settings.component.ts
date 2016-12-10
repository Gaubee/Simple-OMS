import { Component, OnInit } from '@angular/core';
import { AppComponent } from "../app.component";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(private _app: AppComponent) { }

  ngOnInit() {
    const app = this._app;
    const fab_handle = app.fab_handle;

    app.toolbar_title = "设置中心";
    fab_handle.enabled = false;

  }

}
