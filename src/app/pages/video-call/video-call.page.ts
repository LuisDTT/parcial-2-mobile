import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.page.html',
  styleUrls: ['./video-call.page.scss'],
  standalone: false,
})
export class VideoCallPage implements OnInit {
  jitsiUrl!: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const meetingId = this.route.snapshot.paramMap.get('meetingId');
    const url = `https://jitsi1.geeksec.de/${meetingId}`;
    this.jitsiUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url!);
  }
}
