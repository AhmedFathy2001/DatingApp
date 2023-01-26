import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../_services/message.service';
import { Location } from '@angular/common';

@Directive({
  selector: '[pinScroll]',
})
export class PinScrollDirective implements OnInit, OnDestroy {
  hadLoaded = false;
  private observer = new MutationObserver(() => {
    this.scrollToPin();
  });

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private location: Location
  ) {}

  ngOnInit() {
    this.observer.observe(this.el.nativeElement, {
      childList: true,
    });
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  private scrollToPin() {
    if (!this.hadLoaded && !this.route.snapshot.fragment) {
      this.hadLoaded = true;
      this.el.nativeElement.style.scrollBehavior = 'auto';
    } else {
      this.el.nativeElement.style.scrollBehavior = 'smooth';
    }

    if (!this.route.snapshot.fragment) {
      this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight;
      return;
    }
    const fragmentEle = document.getElementById(this.route.snapshot.fragment);

    this.location.replaceState(this.location.path().split('#')[0]);
    if (!fragmentEle) {
      this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight;
      return;
    }
    fragmentEle.scrollIntoView();
  }
}
