import {Component} from '@angular/core';
import {CommonModule} from "@angular/common";
import {CardModule} from "primeng/card";
import {ButtonModule} from 'primeng/button';
import {LinkComponent} from "../../components/link/link.component";

@Component({
    standalone: true,
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [CommonModule, CardModule, ButtonModule, LinkComponent]
})
export class DashboardComponent {
    renderUrl: string = "https://render.com";
    nodejsUrl: string = "https://nodejs.org/";
    expressjsUrl: string = "https://expressjs.com/";
    tcgdexUrl: string = "https://tcgdex.dev/";
    mongodbDiscoveryUrl: string = "https://www.ovhcloud.com/en/lp/mongodb-discovery/";
    mongodbUrl: string = "http://mongodb.com/";
    ghPagesUrl: string = "https://pages.github.com/";
    angularUrl: string = "https://angular.dev/";
    primengUrl: string = "https://primeng.org/";
}
