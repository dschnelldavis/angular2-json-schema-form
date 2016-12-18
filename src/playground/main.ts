import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { PlaygroundModule } from './playground.module';

export function main() {
  platformBrowserDynamic().bootstrapModule(PlaygroundModule);
}

if (document.readyState === 'complete') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
