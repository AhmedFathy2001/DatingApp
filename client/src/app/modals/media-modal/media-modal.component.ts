import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MediaType } from '../../_models/createMessage';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-media-modal',
  templateUrl: './media-modal.component.html',
  styleUrls: ['./media-modal.component.css'],
})
export class MediaModalComponent {
  @Input() openedFileSrc: string | undefined;
  @Input() openedFileType: MediaType | undefined;
  @Input() openedFileContent: string | undefined;
  modalRef: BsModalRef<MediaModalComponent> =
    new BsModalRef<MediaModalComponent>();
  @ViewChild('template') content: TemplateRef<any> | undefined;

  constructor(private modalService: BsModalService) {}

  openModal() {
    if (this.content) {
      this.modalRef = this.modalService.show(this.content, {
        class: 'modal-dialog-centered',
      });
    }
  }
}
