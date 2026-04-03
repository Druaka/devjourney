import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TcgdexService} from '../../services/tcgdex.service';
import {CommonModule} from "@angular/common";
import {Panel} from "primeng/panel";
import {DataViewModule} from 'primeng/dataview';
import {SelectButtonModule} from 'primeng/selectbutton';
import {FormsModule} from '@angular/forms';
import {DividerModule} from 'primeng/divider';
import {TagModule} from "primeng/tag";
import {DropdownModule} from 'primeng/dropdown';
import {RippleModule} from 'primeng/ripple';
import {Button} from "primeng/button";
import {InputTextModule} from 'primeng/inputtext';
import {InputGroupAddon} from "primeng/inputgroupaddon";
import {InputGroup} from "primeng/inputgroup";

@Component({
    selector: 'app-sets',
    templateUrl: './sets.component.html',
    styleUrls: ['./sets.component.scss'],
    standalone: true,
    imports: [CommonModule, Panel, DataViewModule, SelectButtonModule, FormsModule, DividerModule, TagModule, DropdownModule, RippleModule, Button, InputTextModule, InputGroupAddon, InputGroup]
})
export class SetsComponent implements OnInit {
    sets: any[] = [];
    layout: 'grid' | 'list' = 'grid';
    options: { label: string, value: 'grid' | 'list' }[] = [
        //{label: 'Grid', value: 'grid'},
        //{label: 'List', value: 'list'}
    ];
    sortOptions: { label: string, value: string }[] = [
        {label: '📅', value: 'releaseDate'},
        {label: '🆎', value: 'name'}
    ];
    sortKey: string = 'releaseDate';
    sortOrder: number = -1;
    searchTerm: string = '';

    constructor(private tcgdexService: TcgdexService, private route: ActivatedRoute, private router: Router) {
    }

    ngOnInit(): void {
        this.route.url.subscribe(url => {
            const currentRoute = url[0].path;
            if (currentRoute === 'ptcg-sets') {
                this.tcgdexService.fetchPtcgSets().subscribe(data => {
                    this.sets = data;
                    this.sortSets();
                });
            } else if (currentRoute === 'tcgp-sets') {
                this.tcgdexService.fetchTcgpSets().subscribe(data => {
                    this.sets = data;
                    this.sortSets();
                });
            }
        });
    }

    setSortOrder(order: number) {
        this.sortOrder = order;
        this.sortSets();
    }

    sortSets() {
        this.sets.sort((a, b) => {
            let value1 = a[this.sortKey];
            let value2 = b[this.sortKey];
            if (this.sortKey === 'releaseDate') {
                value1 = new Date(value1).getTime();
                value2 = new Date(value2).getTime();
            }
            return (value1 < value2 ? -1 : (value1 > value2 ? 1 : 0)) * this.sortOrder;
        });
    }

    filteredSets() {
        return this.sets.filter(set => set.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }

    clearSearch() {
        this.searchTerm = '';
    }

    getLogoUrl(set: any): string {
        let logo = set.logo;
        let name = set.name;
        let url: string;
        if (logo) {
            url = logo + '.webp';
        } else if (name.toLowerCase().includes("black star promo")) {
            url = 'ptcg/blackstar.png';
        } else if (name.toLowerCase().includes("dragon majesty")) {
            url = 'ptcg/dragon-majesty.png';
        } else if (name.toLowerCase().includes("macdonald")) {
            url = 'ptcg/mcdonald.png';
        } else if (name.toLowerCase().includes("shining legends")) {
            url = 'ptcg/shining-legends.png';
        } else if (name.toLowerCase().includes("temporal forces")) {
            url = 'ptcg/temporal-forces.png';
        } else if (name.toLowerCase().includes("trainer kit")) {
            url = 'ptcg/trainer-kit.png';
        } else {
            url = 'ptcg/na.png';
        }
        return url;
    }

    viewCards(set: any) {
        this.tcgdexService.setCards(set.cards);
        this.router.navigate(['/cards']);
    }
}
