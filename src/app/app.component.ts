/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, Optional } from '@angular/core';

import { AppState } from './app.service';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';
import { mix_options, copy } from "./common";

interface FabButtonHandle {
    button_text?: string;
    button_tooltip?: string;
    click_event?(): void;
    enabled?: boolean,
    disabled?: boolean,
};
interface LoadingBarHandle {
    show?: boolean;
    mode?: string;
    value?: number;
    bufferValue?: number;
}
const DEFAULT_FAB_HANDLE: FabButtonHandle = {
    button_text: "",
    button_tooltip: "",
    click_event: () => {
        console.log("nothing but add.");
    },
    enabled: false,//show
    disabled: false
};
const DEFAULT_LOADING_BAR: LoadingBarHandle = {
    show: false,
    mode: "indeterminate",
    value: 0,
    bufferValue: 0,
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
    name = 'Angular 2 Webpack Starter';
    url = 'https://twitter.com/AngularClass';
    toolbar_title = "Angular Material2 Example App";

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

    constructor(
        public appState: AppState,
        private _dialog: MdDialog,
        private _snackbar: MdSnackBar) {
        setInterval(() => {
            this.progress = (this.progress + Math.floor(Math.random() * 4) + 1) % 100;
        }, 200);
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