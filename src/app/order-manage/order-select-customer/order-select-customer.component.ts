import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'app-order-select-customer',
  templateUrl: './order-select-customer.component.html',
  styleUrls: ['./order-select-customer.component.css']
})
export class OrderSelectCustomerComponent implements OnInit {

  constructor(
    public dialogRef: MdDialogRef<OrderSelectCustomerComponent>
  ) { }

  ngOnInit() {
  }

}