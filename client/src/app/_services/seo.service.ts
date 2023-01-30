import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private titleService: Title, private metaService: Meta) {}

  updateTitleAndMeta(title: string, description: string, keywords?: string) {
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    if (keywords)
      this.metaService.updateTag({ name: 'keywords', content: keywords });
  }
}
