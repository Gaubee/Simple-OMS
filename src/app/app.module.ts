import {
  NgModule, ApplicationRef
  , Component, ContentChildren, Directive, Input, QueryList
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent, DialogContent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { HomeComponent } from './home';
import { AboutComponent } from './about';
import { NoContentComponent } from './no-content';
// import { XLarge } from './home/x-large';
import { MyDatePickerModule } from 'MyDatePicker'

import { NavComponent } from './nav/nav.component';
import { OrderManageComponent, OrderAddComponent, OrderUpdateComponent, FixedPipe, FocusDirective } from './order-manage/order-manage.component';
import { OrderItemComponent, OrderItemListComponent } from './order-manage/order-item/order-item.component';
import { OrderSelectCustomerComponent } from './order-manage/order-select-customer/order-select-customer.component';
import { MaterialManageComponent, MaterialAddComponent, MaterialUpdateComponent } from './material-manage/material-manage.component';
import { CustomerManageComponent, CustomerCardComponent } from './customer-manage/customer-manage.component';
import { CustomerEditComponent } from './customer-manage/customer-edit/customer-edit.component';
import { SettingsComponent } from './settings/settings.component';

import { MaterialModule } from '@angular/material';
import { MdSelectModule } from './md-dev-com/select';
import 'hammerjs';

// Services
import { MaterialService } from './material-manage/material.service'
import { OrderService } from './order-manage/order.service'
import { CustomerService } from './customer-manage/customer.service'

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent
    , DialogContent
    , AboutComponent
    , HomeComponent
    , NoContentComponent
    // , XLarge

    , NavComponent
    , OrderManageComponent, OrderAddComponent, OrderUpdateComponent, OrderSelectCustomerComponent
    , MaterialManageComponent, MaterialAddComponent, MaterialUpdateComponent
    , CustomerEditComponent, CustomerManageComponent, CustomerCardComponent
    , SettingsComponent

    , FixedPipe, FocusDirective
    , OrderItemComponent, OrderItemListComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES, { useHash: true, preloadingStrategy: PreloadAllModules }),
    MaterialModule.forRoot(),
    MyDatePickerModule,
    MdSelectModule.forRoot()
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS,
    MaterialService,
    OrderService,
    CustomerService,
  ],
  entryComponents: [DialogContent, OrderSelectCustomerComponent],
})
export class AppModule {
  constructor(public appRef: ApplicationRef, public appState: AppState) { }

  hmrOnInit(store: StoreType) {
    if (!store || !store.state) return;
    console.log('HMR store', JSON.stringify(store, null, 2));
    // set state
    this.appState._state = store.state;
    // set input values
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // save state
    const state = this.appState._state;
    store.state = state;
    // recreate root elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // save input values
    store.restoreInputValues = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(store: StoreType) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}

