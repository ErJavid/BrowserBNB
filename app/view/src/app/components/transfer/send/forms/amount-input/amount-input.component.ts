import {Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ITransaction, StateService} from "../../../../../services/state.service";
import {Observable, of} from "rxjs";
import {map} from "rxjs/operators";

@Component({
    selector: 'app-amount-input',
    templateUrl: './amount-input.component.html',
    styleUrls: ['./amount-input.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AmountInputComponent implements OnInit, OnDestroy {

    emailFormControl = new FormControl('', []);
    baseSymbol: Observable<string>;
    secondarySymbol: Observable<string>;
    calculatedSum: Observable<number>;
    secondaryName: Observable<string>;
    rate2usd: Observable<number>;
    isSwapped: boolean;
    isNotAllowed: boolean;

    // @ts-ignore
    @ViewChild('sum') rawSum: ElementRef;

    constructor(private stateService: StateService) {

        this.stateService.currentTransaction.subscribe((x: ITransaction) => {
            this.baseSymbol = of(x.Symbol);
            this.secondaryName = of('USD');
            this.secondarySymbol = of('');
            this.calculatedSum = of(0);
            if (x.Symbol === 'BNB') {
                this.rate2usd = this.stateService.bnb2usdRate$;
            } else {
                this.rate2usd = of(x.rate2usd);
            }
            if (x.rate2usd === 0) {
                this.secondaryName = of('');
                this.isNotAllowed = true;
            } else {
                this.secondaryName = of('USD');
                this.isNotAllowed = false;
            }
        });
    }


    calcSums() {
        const sum = +((this.rawSum.nativeElement as HTMLInputElement).value);
        if (!this.isSwapped) {
            this.stateService.currentTransaction.subscribe((x: ITransaction) => {
                this.calculatedSum = this.rate2usd.pipe(
                    map((rate: number) => {
                        return rate * sum;
                    }),
                    // tslint:disable-next-line:no-shadowed-variable
                    map((x: number) => {
                        return +x.toFixed(2);
                    })
                );
            });
        } else {
            this.stateService.currentTransaction.subscribe((x: ITransaction) => {
                this.calculatedSum = this.rate2usd.pipe(
                    map((rate: number) => {
                        if (rate * sum === 0) {
                            return 0;
                        }
                        return 1 / rate * sum;
                    }),
                    // tslint:disable-next-line:no-shadowed-variable
                    map((x: number) => {
                        return +x.toFixed(2);
                    })
                );
            });
        }
        const newTx = this.stateService.currentTransaction.getValue();
        newTx.Amount = sum;
        this.stateService.currentTransaction.next(newTx);
    }

    swapCurrencies() {
        if (!this.isNotAllowed) {
            this.isSwapped = !this.isSwapped;
            const temp = this.baseSymbol;
            this.baseSymbol = this.secondaryName;
            this.secondaryName = temp;
        }
    }

    beautifyName(name: Observable<string>): Observable<string> {
        return name.pipe(map((x: string) => {
            if (x.length > 7) {
                return x.substring(0, 4) + '...';
            }
            return x;
        }));
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

}
