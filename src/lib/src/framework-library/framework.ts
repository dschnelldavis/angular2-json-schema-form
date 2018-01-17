import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class Framework {
    name: string
    framework: any
    widgets?: { [key: string]: any }
    stylesheets?: string[] = []
    scripts?: string[] = []
};
