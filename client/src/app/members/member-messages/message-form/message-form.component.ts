import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { MediaModalComponent } from '../../../modals/media-modal/media-modal.component';
import { generateUUID } from '../../../_helpers/uuid';
import { IFile } from '../../../_models/file';
import { ToastrService } from 'ngx-toastr';
import { readUploadedFileAsDataURL } from '../../../_helpers/fileReader';

@Component({
  selector: 'app-message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.css'],
})
export class MessageFormComponent {
  @ViewChild(MediaModalComponent) modal: MediaModalComponent | undefined;
  // isHovering = false;
  @Input() isFileOver = false;

  content = '';
  files: IFile[] | undefined;
  @Output() onSubmit = new EventEmitter<{
    content: string;
    files: File[] | undefined;
  }>();
  mediaFiles: string[] = [];
  faImage = faImage;
  file: File | undefined;
  mediaFile: string | undefined;

  constructor(private toastr: ToastrService) {}

  async addToQueue(event: File[]) {
    this.files = undefined;
    this.mediaFiles = [];
    let files: IFile[] | undefined;

    if (event.length > 0) {
      if (event.length > 6) {
        this.toastr.error('Media count should not exceed 6 per message');
        return;
      }

      files = Array.from(event).map((f) => {
        return { id: generateUUID(), file: f };
      });
    }

    this.files = files;

    if (files && FileReader) {
      for (let i = 0; i < files.length; i++) {
        const type = files[i].file.type.split('/')[0];
        if (type != 'image' && type != 'video') {
          this.toastr.error(
            `Unsupported media type, ${files[i].file.name} was removed.`
          );
          files.slice(i, 1);
          continue;
        }
        if (files[i].file.size > 20 * 1024 * 1024) {
          this.toastr.error(
            `Individual File size must not exceed 20mb ${files[i].file.name} was removed.`
          );
          files.slice(i, 1);
          continue;
        }
        const previewUrl: string | ArrayBuffer | undefined =
          await readUploadedFileAsDataURL(files[i].file);
        this.mediaFiles.push(previewUrl);
      }
    }
  }

  clearMedia() {
    this.files = undefined;
    this.mediaFiles = [];
  }

  removePreviewFile(fileId: string, src: string) {
    this.files = this.files?.filter((f) => f.id !== fileId);
    this.mediaFiles = this.mediaFiles?.filter((s) => s !== src);
  }

  resetForm() {
    this.content = '';
    this.clearMedia();
  }

  onSubmitForm() {
    this.onSubmit.emit({
      content: this.content,
      files: this.files?.map((f) => {
        return f.file;
      }),
    });
  }

  onFileOver(event: boolean) {
    this.isFileOver = event;
  }

  openModal(file: File, src: string) {
    this.file = file;
    this.mediaFile = src;

    this.modal?.openModal();
  }
}
