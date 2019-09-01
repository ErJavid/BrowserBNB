import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";
import {map, take, takeUntil} from "rxjs/operators";
import {Observable, Subscription, timer} from "rxjs";
import {ClipboardService} from "../../../services/clipboard.service";
import {ChromeApiService} from "../../../services/chrome-api.service";
import {StateService} from "../../../services/state.service";

@Component({
    selector: 'app-recieve',
    templateUrl: './recieve.component.html',
    styleUrls: ['./recieve.component.css']
})
export class RecieveComponent implements OnInit {
    subscription: Subscription;
    address$: Observable<string>;
    copyMessage = 'Copy to clipboard';
    qrCode: string;
    network: string;
    constructor(private location: Location, private clipboardService: ClipboardService, private  chrome: ChromeApiService, private stateService: StateService) {
        this.address$ = this.stateService.currentAddress$;

        this.subscription = this.address$.pipe(
            map((address) => {
                this.network = this.stateService.selectedNetwork$.getValue().label.toLocaleLowerCase();
                this.qrCode = address;
            })
        ).subscribe();
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    copyAddress() {
        this.address$.pipe(
            takeUntil(timer(100)),
            take(1),
        ).subscribe((address) => {
            this.clipboardService.copyToClipboard(address);
            this.copyMessage = 'Copied ✔';
        });
    }

    openTab(address$: any) {
        let url;
        switch (this.network) {
            case 'mainnet':
                url = 'https://explorer.binance.org/address/';
                break;
            case 'testnet':
                url = 'https://testnet-explorer.binance.org/address/';
        }
        address$.pipe(
            map((address: any) => {
                this.chrome.openNewTab(`${url}${address}`)
            }),
            take(1)
        ).subscribe()
    }

    goBack() {
        this.location.back();
    }
}
