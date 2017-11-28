import { Route } from '@angular/router';

import { DemoComponent } from './demo.component';
import { CmsceDemoComponent } from './cmsce-demo.component';

export const routes: Route[] = [
  { path: '', component: CmsceDemoComponent },
  { path: '**', component: CmsceDemoComponent },
  { path: 'default', component: DemoComponent }
];
