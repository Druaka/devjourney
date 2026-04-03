import {Routes} from '@angular/router';
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {JournalComponent} from "./pages/journal/journal.component";
import {SetsComponent} from "./pages/sets/sets.component";
import {CardsComponent} from "./pages/cards/cards.component";

export const routes: Routes = [
    {path: '', component: DashboardComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'journal', component: JournalComponent},
    {path: 'ptcg-sets', component: SetsComponent},
    {path: 'tcgp-sets', component: SetsComponent},
    {path: 'cards', component: CardsComponent},
];
