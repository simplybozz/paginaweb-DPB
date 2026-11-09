import { computed, Injectable, signal } from '@angular/core';
import { DbService } from './db.service';
import { StoreSettings } from './models';
import { SEED_SETTINGS } from './seed';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly data = signal<StoreSettings>(SEED_SETTINGS);

  readonly settings = this.data.asReadonly();
  readonly activeBanks = computed(() => this.data().banks.filter((b) => b.active));
  readonly whatsappLink = computed(() => `https://wa.me/1${this.data().whatsapp.replace(/\D/g, '')}`);
  readonly instagramLink = computed(() => `https://www.instagram.com/${this.data().instagram}/`);

  constructor(private db: DbService) {
    this.load();
    db.onExternalChange(() => this.load());
  }

  load() {
    this.data.set(this.db.read<StoreSettings>('settings', SEED_SETTINGS));
  }

  save(patch: Partial<StoreSettings>) {
    const next = { ...this.data(), ...patch };
    this.db.write('settings', next);
    this.data.set(next);
  }

  brandLogo(name: string) {
    return this.data().brands.find((b) => b.name.toLowerCase() === name.toLowerCase())?.logo;
  }
}
