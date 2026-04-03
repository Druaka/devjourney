import {Component, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule, DOCUMENT, ViewportScroller} from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {MenuItem} from "primeng/api";
import {Avatar} from "primeng/avatar";
import {Menubar} from "primeng/menubar";
import {filter} from 'rxjs/operators';
import {PingService} from "../services/ping.service";
import {Tag} from "primeng/tag";

@Component({
    standalone: true,
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    imports: [CommonModule, RouterModule, Menubar, Avatar, Tag]
})
export class LayoutComponent implements OnInit {
    @ViewChild('menuBar') menuBar!: Menubar;
    document = inject(DOCUMENT);
    darkTheme = true;
    statusMsg: string = 'HIBERNATING';
    statusImg: string = 'loading.gif';
    statusIcon: string = 'pi-spin pi-spinner-dotted';
    selectedItemLabel: string = 'Dashboard';
    allItems: (MenuItem & { show?: boolean })[] = [];
    items: MenuItem[] = [];

    constructor(private router: Router, private viewportScroller: ViewportScroller, private pingService: PingService) {
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.menuBar) return;

        const menuButton = this.menuBar.menubutton?.nativeElement as HTMLElement;
        const clickedMenuButton = menuButton?.contains(event.target as Node);

        // Check if the click was inside a menubar item
        const menuItems = this.menuBar.el?.nativeElement.querySelectorAll('.p-menubar-item');
        const clickedInsideMenuItem = Array.from(menuItems ?? []).some(item =>
            (item as HTMLElement).contains(event.target as Node)
        );

        if (!clickedInsideMenuItem && this.menuBar.mobileActive && !clickedMenuButton) {
            menuButton?.click(); // Close menu if clicked outside menu items and menu button
        }
    }

    ngOnInit() {
        const storedTheme = localStorage.getItem('darkTheme');
        this.darkTheme = storedTheme === 'true';
        this.document.documentElement.classList.toggle('p-dark', this.darkTheme);

        this.allItems = [
            {label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard', show: true},
            // {label: 'Journal', icon: 'pi pi-book', routerLink: '/journal', show: true},
            {
                label: 'Pokémon',
                icon: 'pi pi-folder',
                parent: true,
                show: true,
                items: [
                    {label: 'Pokémon TCG', icon: 'pi pi-book', routerLink: '/ptcg-sets'},
                    {label: 'Pokémon TCG Pocket', icon: 'pi pi-book', routerLink: '/tcgp-sets'}
                ]
            },
            {label: 'Cards', icon: 'pi pi-book', routerLink: '/cards', show: false}
        ];

        this.items = this.allItems.filter(item => item.show);

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateSelectedItemLabel();
            this.viewportScroller.scrollToPosition([0, 0]);
        });

        this.pingService.ping().subscribe({
            next: (res) => {
                this.statusMsg = 'READY';
                this.statusImg = 'ready.gif';
                this.statusIcon = 'pi-check-circle';
            },
            error: (err) => {
                this.statusMsg = 'ERROR';
                this.statusImg = 'error.gif';
                this.statusIcon = 'pi-exclamation-circle';
                console.error(err);
            }
        });
    }

    onItemSelect(item: MenuItem) {
        if (!item['parent']) {
            this.selectedItemLabel = item.label ?? 'Dashboard';
        }
    }

    updateSelectedItemLabel() {
        const currentRoute = this.router.url;
        const findItem = (items: MenuItem[]): MenuItem | undefined =>
            items.find(item =>
                item.routerLink === currentRoute && !item['parent']
            ) ?? items.flatMap(item => item.items ? [item.items] : [])
                .flat()
                .map(sub => findItem([sub]))
                .find(Boolean);

        const currentItem = findItem(this.allItems);
        this.selectedItemLabel = currentItem?.label ?? 'Dashboard';
    }

    toggleDarkMode(): void {
        this.darkTheme = !this.darkTheme;
        this.document.documentElement.classList.toggle('p-dark', this.darkTheme);
        localStorage.setItem('darkTheme', this.darkTheme.toString());
    }
}
