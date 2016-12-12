import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home';
import { AboutComponent } from './about';
import { NoContentComponent } from './no-content';

import { DataResolver } from './app.resolver';



import { OrderManageComponent, OrderAddComponent, OrderUpdateComponent } from './order-manage/order-manage.component';
import { MaterialManageComponent, MaterialAddComponent, MaterialUpdateComponent } from './material-manage/material-manage.component';
import { CustomerManageComponent } from './customer-manage/customer-manage.component';
import { SettingsComponent } from './settings/settings.component';



export const ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  {
    path: 'detail', loadChildren: () => System.import('./+detail')
      .then((comp: any) => comp.default),
  },
  { path: 'orders', component: OrderManageComponent },
  { path: 'orders/new', component: OrderAddComponent },
  { path: 'orders/new/:customer_id', component: OrderAddComponent },
  { path: 'orders/:id', component: OrderUpdateComponent },
  { path: 'materials', component: MaterialManageComponent },
  { path: 'materials/new', component: MaterialAddComponent },
  { path: 'materials/:id', component: MaterialUpdateComponent },
  { path: 'customers', component: CustomerManageComponent },
  { path: 'settings', component: SettingsComponent },

  { path: '**', component: NoContentComponent },
];
