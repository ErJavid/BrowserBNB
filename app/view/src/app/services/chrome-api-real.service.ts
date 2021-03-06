import {Injectable} from "@angular/core";
import {Observable, Subject, timer} from "rxjs";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {IChromeApiService} from "./chrome-api.service";
import {FromPage2BackgroundMsg} from './chrome-api-dto';
import Port = chrome.runtime.Port;

function fromMessages(port: Port): Observable<any> {
    const subject = new Subject<any>();
    port.onMessage.addListener((message: any) => {
        subject.next(message);
    });
    return subject.asObservable();
}

@Injectable()
export class ChromeApiRealService implements IChromeApiService {

    msg: any;
    port: Port;
    msgFromBackground$: Observable<any>;
    readonly sessionTimeout: number = 10000; // 10s

    constructor() {

        console.log('A');
        this.port = chrome.runtime.connect({
            name: 'port-password'
        });

        console.log('B');


        console.log('C');

        // port-wallet-connect

        this.msgFromBackground$ = timer(0, 100).pipe(
          map(() => this.msg),
          filter((msg) => !!msg),
          distinctUntilChanged(),
        );

        // this.port.onMessage.addListener((msg: FromBackgroundToPageMsg) => {
        //     console.log('next=', msg);
        //     // this.msgFromBackground$.next(msg);
        //     // this.password = msg.password;
        //     this.msg = msg;
        //     console.log('this.msg=', this.msg);
        // });

        fromMessages(this.port).subscribe( (msg: any) => {
            this.msg = msg;
        });
    }


    openNewTab(url: string): void {
        chrome.tabs.create({url: url});
    }

    restorePassword(): Observable<string> {

        return this.msgFromBackground$.pipe(
          map((msg: any) => {
              return msg.password;
          })
        );

        // console.log('Send Restore Password!');
        // const msg: FromPage2BackgroundMsg = {
        //     type: 'restoreExtensionSessionRequest'
        // };
        //
        // this.port.postMessage(msg);
        // return this.msgFromBackground$.pipe(
        //   // tap((x) => {
        //   //     console.log('msgFromBackground$=', x);
        //   // }),
        //   take(1),
        //   map((password: string) => {
        //       console.log(`!!!!!${password}!!!!!!`);
        //       return (password) || '';
        //   })
        // );
    }

    savePassword(password: string): void {
        console.log('savePassword=', password);
        const msg: FromPage2BackgroundMsg = {
            type: 'startExtensionSession',
            password,
            timeout: this.sessionTimeout
        };

        this.port.postMessage(msg);
    }

    dropPassword() {
        const msg: FromPage2BackgroundMsg = {
            type: 'dropExtensionSession'
        };

        this.port.postMessage(msg);
    }

    sendKeepAlive() {
        // const msg: FromPage2BackgroundMsg = {
        //     type: 'keepAlive'
        // };
        //
        // this.port.postMessage(msg);
    }
}
