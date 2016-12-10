import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

@Component({
  selector: 'no-content',
  template: `
    <md-card>
      <h1>错误页面！请联系开发人员。</h1>
    </md-card>
  `
})
export class NoContentComponent implements OnInit {
  constructor(private _app: AppComponent) { }
  ngOnInit() {
    this._app.toolbar_title = "找不到指定页面";
  }
}
