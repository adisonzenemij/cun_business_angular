import { Routes } from '@angular/router';
import { CeLogin } from './core/ce-login/ce-login';
import { PtHome } from './web/portal/pt-home/pt-home';
import { Portal } from './web/portal/portal';
import { Working } from './web/working/working';
import { WgDashboard } from './web/working/wg-dashboard/wg-dashboard';
import { WgModule } from './web/working/wg-module/wg-module';
import { MdE144c860 } from './web/working/md-e144c860/md-e144c860';
import { MdA7b95fe8 } from './web/working/md-a7b95fe8/md-a7b95fe8';
import { MdD35a393b } from './web/working/md-d35a393b/md-d35a393b';
import { Md8ebaa791 } from './web/working/md-8ebaa791/md-8ebaa791';
import { MdA1cc27fb } from './web/working/md-a1cc27fb/md-a1cc27fb';
import { MdB64883b6 } from './web/working/md-b64883b6/md-b64883b6';
import { MdE5520e1e } from './web/working/md-e5520e1e/md-e5520e1e';
import { MdA6aedeb5 } from './web/working/md-a6aedeb5/md-a6aedeb5';
import { MdA3b378b4 } from './web/working/md-a3b378b4/md-a3b378b4';
import { MdD5fb87de } from './web/working/md-d5fb87de/md-d5fb87de';
import { MdD2e6ded6 } from './web/working/md-d2e6ded6/md-d2e6ded6';
import { MdD76a0e67 } from './web/working/md-d76a0e67/md-d76a0e67';
import { MdA5acf579 } from './web/working/md-a5acf579/md-a5acf579';
import { MdD8d07776 } from './web/working/md-d8d07776/md-d8d07776';
import { MdA1fecd50 } from './web/working/md-a1fecd50/md-a1fecd50';
import { MdE9cb64fd } from './web/working/md-e9cb64fd/md-e9cb64fd';
import { MdB602ef28 } from './web/working/md-b602ef28/md-b602ef28';
import { MdD02ee146 } from './web/working/md-d02ee146/md-d02ee146';
import { MdA8dc1924 } from './web/working/md-a8dc1924/md-a8dc1924';
import { MdB52d40d1 } from './web/working/md-b52d40d1/md-b52d40d1';
import { authGuard } from './guards/auth.guard';
import { resourcePermissionGuard } from './guards/resource-permission.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'portal/home' },
  {
    path: 'portal',
    component: Portal,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: PtHome },
    ],
  },
  { path: 'login', component: CeLogin, canActivate: [loginGuard] },
  {
    path: 'working',
    component: Working,
    canActivate: [authGuard],
    canActivateChild: [authGuard, resourcePermissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: WgDashboard },
      { path: 'module/:moduleId', component: WgModule },
      {
        path: 'society',
        loadComponent: () => import('./web/working/wg-society/wg-society').then((module) => module.WgSociety),
      },
      {
        path: 'rues',
        loadComponent: () => import('./web/working/wg-rues/wg-rues').then((module) => module.WgRues),
      },
      {
        path: 'report',
        loadComponent: () => import('./web/working/wg-report/wg-report').then((module) => module.WgReport),
      },
      { path: 'e144c860', component: MdE144c860 },
      { path: 'a7b95fe8', component: MdA7b95fe8 },
      { path: 'd35a393b', component: MdD35a393b },
      { path: '8ebaa791', component: Md8ebaa791 },
      { path: 'a1cc27fb', component: MdA1cc27fb },
      { path: 'b64883b6', component: MdB64883b6 },
      { path: 'e5520e1e', component: MdE5520e1e },
      { path: 'a6aedeb5', component: MdA6aedeb5 },
      { path: 'a3b378b4', component: MdA3b378b4 },
      { path: 'd5fb87de', component: MdD5fb87de },
      { path: 'd2e6ded6', component: MdD2e6ded6 },
      { path: 'd76a0e67', component: MdD76a0e67 },
      { path: 'a5acf579', component: MdA5acf579 },
      { path: 'd8d07776', component: MdD8d07776 },
      { path: 'a1fecd50', component: MdA1fecd50 },
      { path: 'e9cb64fd', component: MdE9cb64fd },
      { path: 'b602ef28', component: MdB602ef28 },
      { path: 'd02ee146', component: MdD02ee146 },
      { path: 'a8dc1924', component: MdA8dc1924 },
      { path: 'b52d40d1', component: MdB52d40d1 },
    ],
  },
  { path: '**', redirectTo: 'portal/home' },
];
