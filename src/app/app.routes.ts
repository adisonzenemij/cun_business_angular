import { Routes } from '@angular/router';
import { CeLogin } from './core/ce-login/ce-login';
import { PtHome } from './web/portal/pt-home/pt-home';
import { Portal } from './web/portal/portal';
import { Working } from './web/working/working';
import { WgDashboard } from './web/working/wg-dashboard/wg-dashboard';
import { MdE144c860 } from './web/working/md-e144c860/md-e144c860';
import { MdB64883b6 } from './web/working/md-b64883b6/md-b64883b6';
import { MdE5520e1e } from './web/working/md-e5520e1e/md-e5520e1e';
import { MdA6aedeb5 } from './web/working/md-a6aedeb5/md-a6aedeb5';
import { MdA3b378b4 } from './web/working/md-a3b378b4/md-a3b378b4';
import { MdD5fb87de } from './web/working/md-d5fb87de/md-d5fb87de';
import { MdD2e6ded6 } from './web/working/md-d2e6ded6/md-d2e6ded6';
import { MdD76a0e67 } from './web/working/md-d76a0e67/md-d76a0e67';
import { MdA5acf579 } from './web/working/md-a5acf579/md-a5acf579';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'portal/home' },
  { path: 'portal', component: Portal, children: [{ path: '', pathMatch: 'full', redirectTo: 'home' }, { path: 'home', component: PtHome }] },
  { path: 'login', component: CeLogin },
  { path: 'working', component: Working, canActivate: [authGuard], canActivateChild: [authGuard], children: [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }, { path: 'dashboard', component: WgDashboard },
    { path: 'e144c860', component: MdE144c860 }, { path: 'b64883b6', component: MdB64883b6 },
    { path: 'e5520e1e', component: MdE5520e1e }, { path: 'a6aedeb5', component: MdA6aedeb5 },
    { path: 'a3b378b4', component: MdA3b378b4 }, { path: 'd5fb87de', component: MdD5fb87de },
    { path: 'd2e6ded6', component: MdD2e6ded6 }, { path: 'd76a0e67', component: MdD76a0e67 },
    { path: 'a5acf579', component: MdA5acf579 },
  ] },
  { path: '**', redirectTo: 'portal/home' },
];
