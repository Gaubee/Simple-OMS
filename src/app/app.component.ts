/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, Optional } from '@angular/core';

import { AppState } from './app.service';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';
import { mix_options, copy } from "./common";
import { Router, NavigationStart } from '@angular/router';

interface FabButtonHandle {
    button_text?: string;
    button_tooltip?: string;
    click_event?(): void;
    enabled?: boolean,
    disabled?: boolean,
};
const DEFAULT_FAB_HANDLE: FabButtonHandle = {
    button_text: "",
    button_tooltip: "",
    click_event: () => {
        console.log("nothing but add.");
    },
    enabled: false,//show
    disabled: false
};
interface LoadingBarHandle {
    show?: boolean;
    mode?: string;
    value?: number;
    bufferValue?: number;
}
const DEFAULT_LOADING_BAR: LoadingBarHandle = {
    show: false,
    mode: "indeterminate",
    value: 0,
    bufferValue: 0,
};
interface IconButtonHandle {
    button_text?: string;
    button_tooltip?: string;
    click_event?(): void;
    disabled?: boolean,
};
const DEFAULT_ICON_HANDLE: IconButtonHandle = {
    button_text: "",
    button_tooltip: "",
    click_event: () => {
        console.log("nothing but icon button clicked.");
    },
    disabled: false
};
/*
 * App Component
 * Top Level Component
 */
@Component({
    selector: 'app',
    encapsulation: ViewEncapsulation.None,
    styleUrls: [
        './app.component.scss',
        './material2-app-theme.scss'
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
    version = "v0.0.1";
    angularclassLogo = 'assets/img/angularclass-avatar.png';
    name = '订单管理系统 - 游都科技';
    url = '';
    toolbar_title = "主页";

    isDarkTheme: boolean = false;
    lastDialogResult: string;

    foods: any[] = [
        { name: 'Pizza', rating: 'Excellent' },
        { name: 'Burritos', rating: 'Great' },
        { name: 'French fries', rating: 'Pretty good' },
    ];

    progress: number = 0;

    fab_handle = copy(DEFAULT_FAB_HANDLE);
    mixFabButtonDefault(options: FabButtonHandle) {
        this.fab_handle = mix_options(copy(DEFAULT_FAB_HANDLE), options);
    }
    loading_bar = copy(DEFAULT_LOADING_BAR);
    mixLoadingBarDefault(options: LoadingBarHandle) {
        this.loading_bar = mix_options(copy(DEFAULT_LOADING_BAR), options);
    }

    toolbar_buttons: IconButtonHandle[] = []
    mixIconButtons(options_list: IconButtonHandle[]) {
        this.toolbar_buttons = options_list.map(options => mix_options(copy(DEFAULT_ICON_HANDLE), options))
    }


    constructor(
        public appState: AppState,
        private router: Router,
        private _dialog: MdDialog,
        private _snackbar: MdSnackBar) {
        // setInterval(() => {
        //     this.progress = (this.progress + Math.floor(Math.random() * 4) + 1) % 100;
        // }, 200);
        this.router.events.subscribe((val) => {
            console.log('qaq', val)
            if (val instanceof NavigationStart) {
                if (this.router.url.split(';')[0] !== val.url.split(';')[0]) {
                    this.mixIconButtons([])
                }
            }
        });
    }

    ngOnInit() {
        console.log('Initial App State', this.appState.state);
    }

    openDialog() {
        let dialogRef = this._dialog.open(DialogContent);

        dialogRef.afterClosed().subscribe(result => {
            this.lastDialogResult = result;
        })
    }

    showSnackbar() {
        this._snackbar.open('YUM SNACKS', 'CHEW');
    }
}


@Component({
    template: `
    <p>This is a dialog</p>
    <p>
      <label>
        This is a text box inside of a dialog.
        <input #dialogInput>
      </label>
    </p>
    <p> <button md-button (click)="dialogRef.close(dialogInput.value)">CLOSE</button> </p>
  `,
})
export class DialogContent {
    constructor( @Optional() public dialogRef: MdDialogRef<DialogContent>) { }
}