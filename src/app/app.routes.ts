import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { PublicLayout } from './layout/public-layout';
import { PanelLayout } from './layout/panel-layout';

export const routes: Routes = [
  {
    path: 'panel',
    component: PanelLayout,
    canActivate: [roleGuard('vendedor', 'admin')],
    children: [
      { path: '', title: 'Resumen | Panel D’Patron', loadComponent: () => import('./panel/dashboard').then((m) => m.Dashboard) },
      { path: 'pedidos', title: 'Pedidos | Panel D’Patron', loadComponent: () => import('./panel/orders').then((m) => m.PanelOrders) },
      { path: 'pedidos/:id', title: 'Pedido | Panel D’Patron', loadComponent: () => import('./panel/order-detail').then((m) => m.PanelOrderDetail) },
      { path: 'productos', title: 'Productos | Panel D’Patron', loadComponent: () => import('./panel/products').then((m) => m.PanelProducts) },
      { path: 'almacen', title: 'Almacén | Panel D’Patron', loadComponent: () => import('./panel/inventory').then((m) => m.PanelInventory) },
      { path: 'productos/:id', title: 'Producto | Panel D’Patron', loadComponent: () => import('./panel/product-form').then((m) => m.ProductForm) },
      {
        path: 'usuarios',
        title: 'Usuarios | Panel D’Patron',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./panel/users').then((m) => m.PanelUsers),
      },
      {
        path: 'ajustes',
        title: 'Ajustes | Panel D’Patron',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./panel/settings').then((m) => m.PanelSettings),
      },
    ],
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', title: 'D’Patron Boutique | La boutique de los famosos', loadComponent: () => import('./pages/home').then((m) => m.Home) },
      { path: 'tienda', title: 'Tienda | D’Patron Boutique', loadComponent: () => import('./pages/shop').then((m) => m.Shop) },
      { path: 'tienda/:categoria', title: 'Tienda | D’Patron Boutique', loadComponent: () => import('./pages/shop').then((m) => m.Shop) },
      { path: 'producto/:slug', title: 'Producto | D’Patron Boutique', loadComponent: () => import('./pages/product').then((m) => m.ProductPage) },
      { path: 'carrito', title: 'Carrito | D’Patron Boutique', loadComponent: () => import('./pages/cart').then((m) => m.CartPage) },
      { path: 'pagar', title: 'Pagar | D’Patron Boutique', canActivate: [authGuard], loadComponent: () => import('./pages/checkout').then((m) => m.Checkout) },
      { path: 'nosotros', title: 'Nosotros | D’Patron Boutique', loadComponent: () => import('./pages/about').then((m) => m.About) },
      { path: 'entrar', title: 'Iniciar sesión | D’Patron Boutique', loadComponent: () => import('./pages/login').then((m) => m.Login) },
      { path: 'registro', title: 'Crear cuenta | D’Patron Boutique', loadComponent: () => import('./pages/register').then((m) => m.Register) },
      { path: 'mi-cuenta', title: 'Mis pedidos | D’Patron Boutique', canActivate: [authGuard], loadComponent: () => import('./pages/account').then((m) => m.Account) },
      { path: 'mi-cuenta/pedido/:id', title: 'Mi pedido | D’Patron Boutique', canActivate: [authGuard], loadComponent: () => import('./pages/account-order').then((m) => m.AccountOrder) },
      { path: '**', title: 'Página no encontrada | D’Patron Boutique', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
    ],
  },
];
