import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'app-common-dialog',
  templateUrl: './common-dialog.component.html',
  styleUrls: ['./common-dialog.component.css']
})
export class CommonDialogComponent implements OnInit {

  constructor(
    public dialogRef: MdDialogRef<CommonDialogComponent>
  ) { }

  title = {
    icon_text: "warning",
    icon_color: "yellow",
    text: "警告"
  }
  dialog_content = "";
  dialog_subtitle = "";
  ngOnInit() {
  }

}