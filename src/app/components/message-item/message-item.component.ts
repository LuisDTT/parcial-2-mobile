import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss'],
  standalone: false,
})
export class MessageItemComponent implements OnInit {
  @Input() message!: any;
  @Input() currentUser!: string;
  constructor() {}

  ngOnInit() {}
}
