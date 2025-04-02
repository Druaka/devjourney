import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { JournalComponent } from './pages/journal/journal.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'journal', component: JournalComponent }
];
