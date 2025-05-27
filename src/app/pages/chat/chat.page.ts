import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import {
  VideoRecorder,
  VideoRecorderCamera,
  VideoRecorderPreviewFrame,
} from '@capacitor-community/video-recorder';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { addDoc, collection } from 'firebase/firestore';
import { Observable, timestamp } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatService } from 'src/app/core/services/chat.service';
import { ContactsService } from 'src/app/core/services/contacts.service';
import { ExternalApiService } from 'src/app/core/services/external-api.service';
import { supabaseService } from 'src/app/core/services/supabase.service';
import { startJitsiCall } from 'src/app/utils/jitsi-utils';
import { v4 as uuidv4 } from 'uuid';
import { Geolocation } from '@capacitor/geolocation';
import mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChildren('mapContainer') mapContainers!: QueryList<ElementRef>;
  loadedMapIds = new Set<string>();
  messages: any[] = [];
  newMessage = '';
  contactId!: string;
  currentUserId!: string;
  chatId!: string;
  isRecording = false;

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: ExternalApiService,
    private contactsService: ContactsService,
    private supabaseService: supabaseService,
  ) {}

  async ngOnInit() {
    const contactId = this.route.snapshot.paramMap.get('contactId')!;
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    this.contactId = contactId;
    this.currentUserId = user.uid;
    this.chatId = this.chatService.getChatId(
      this.currentUserId,
      this.contactId,
    );

    this.chatService.getMessages(this.chatId).subscribe((messages) => {
      this.messages = messages;
    });
  }

  ngAfterViewChecked() {
    this.loadMaps();
  }

  loadMaps() {
    if (!this.mapContainers) return;

    this.mapContainers.forEach((container, index) => {
      const msg = this.messages[index];
      if (msg?.type === 'location' && !this.loadedMapIds.has(msg.id)) {
        this.loadMap(msg, container.nativeElement);
        this.loadedMapIds.add(msg.id);
      }
    });
  }

  loadMap(msg: any, container: HTMLElement) {
    mapboxgl.accessToken = '';
    const map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [msg.lng, msg.lat],
      zoom: 14,
    });

    new mapboxgl.Marker().setLngLat([msg.lng, msg.lat]).addTo(map);
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userFromData = await this.contactsService.getUserData(
      this.currentUserId,
    );
    const contactData = await this.contactsService.getUserData(this.contactId);

    if (!contactData) {
      console.error('El contacto no existe');
      return;
    }

    const userFromName = userFromData.firstName || 'Desconocido';
    const tokenFCM = contactData.token;

    this.chatService.sendMessage(
      this.chatId,
      this.currentUserId,
      this.contactId,
      this.newMessage,
    );

    this.newMessage = '';
  }

  selectFile() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const publicUrl = await this.supabaseService.uploadFile(file, 'files');

    if (!publicUrl) {
      console.error('❌ No se pudo subir el archivo');
      return;
    }

    const message = {
      type: 'file',
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      from: this.currentUserId,
      to: this.contactId,
      timestamp: new Date(),
    };

    await this.sendFileMessage(message);
  }

  async sendFileMessage(message: any) {
    const messagesRef = collection(
      this.firestore,
      `chats/${this.chatId}/messages`,
    );
    await addDoc(messagesRef, message);
    console.log('✅ Mensaje enviado');
  }

  async startCall(contactId: string) {
    const meetingId = uuidv4();

    const userFrom = await this.authService.getCurrentUser(); // Remitente
    if (!userFrom) return;

    const userFromData = await this.contactsService.getUserData(userFrom.uid);
    console.log(userFromData);
    const userFromName = userFromData.firstName || 'Desconocido';
    const userFromId = userFrom.uid;

    // Obtener datos del contacto
    const contactRef = doc(this.firestore, `users/${contactId}`);
    const contactSnap = await getDoc(contactRef);

    if (!contactSnap.exists()) {
      console.error('El contacto no existe');
      return;
    }

    const contactData: any = contactSnap.data();
    const tokenFCM = contactData.token;
    const userToId = contactId;

    const payload = {
      token: tokenFCM,
      notification: {
        title: 'Llamada entrante',
        body: `${userFromName} te está llamando`,
      },
      android: {
        priority: 'high',
        data: {
          userId: userToId,
          meetingId,
          type: 'incoming_call',
          name: userFromName,
          userFrom: userFromId,
        },
      },
    };

    try {
      this.notificationService.sendNotification(payload).subscribe({
        next: (res) => {
          console.log('Respuesta:', JSON.stringify(res));
        },
        error: (err) => {
          console.log('Respuesta:', JSON.stringify(err));
        },
      });

      console.log('✅ Notificación enviada');
      startJitsiCall(meetingId);
      // this.router.navigate(['/video-call', meetingId]);
    } catch (err) {
      console.error('❌ Error enviando notificación', err);
    }
  }

  async startRecording() {
    const permission = await VoiceRecorder.requestAudioRecordingPermission();
    if (!permission.value) return;

    await VoiceRecorder.startRecording();
    this.isRecording = true;
  }

  async stopRecording() {
    if (!this.isRecording) return; // evita llamar si no empezó
    this.isRecording = false;

    const result = await VoiceRecorder.stopRecording();

    if (!result.value) {
      console.error('Error al obtener la grabación');
      return;
    }

    const base64 = result.value.recordDataBase64 ?? '';

    const blob = this.supabaseService.base64ToBlobAudio(base64, 'audio/webm');

    console.log('Dejando de grabar');
    const url = await this.supabaseService.uploadToSupabase(blob);
    await this.sendAudioMessage(url);
  }

  async sendAudioMessage(audioUrl: string) {
    const messagesRef = collection(
      this.firestore,
      `chats/${this.chatId}/messages`,
    );
    await addDoc(messagesRef, {
      type: 'audio',
      url: audioUrl,
      from: this.currentUserId,
      to: this.contactId,
      timestamp: new Date(),
    });
  }

  async selectImage() {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 70,
    });

    const base64 = image.base64String!;
    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
    const fileName = `images/${Date.now()}.jpg`;
    const url = await this.supabaseService.uploadMediaFile(fileName, blob);

    this.sendFileMessage({
      type: 'image',
      url,
      from: this.currentUserId,
      to: this.contactId,
      timestamp: new Date(),
    });
  }

  async startVideoRecording() {
    const previewConfig: VideoRecorderPreviewFrame = {
      id: 'video-record',
      stackPosition: 'front',
      width: 'fill',
      height: 'fill',
      x: 0,
      y: 0,
      borderRadius: 0,
    };

    await VideoRecorder.initialize({
      camera: VideoRecorderCamera.BACK,
      previewFrames: [previewConfig],
    });
    await VideoRecorder.startRecording();
    this.isRecording = true;
  }

  async stopVideoRecording() {
    const previewConfig: VideoRecorderPreviewFrame = {
      id: 'video-record',
      stackPosition: 'back',
    };
    await VideoRecorder.editPreviewFrameConfig(previewConfig);
    const result = await VideoRecorder.stopRecording();

    this.isRecording = false;
    const response = await fetch(result.videoUrl);
    const blob = await response.blob();

    // Sube el video a Supabase o tu backend
    const fileName = `videos/${Date.now()}.mp4`;
    const url = await this.supabaseService.uploadMediaFile(fileName, blob);
    this.sendFileMessage({
      type: 'video',
      url,
      from: this.currentUserId,
      to: this.contactId,
      timestamp: new Date(),
    });
  }

  async takePhotoAndSend() {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      const base64Data = `data:image/jpeg;base64,${photo.base64String}`;
      const blob = this.supabaseService.base64ToBlob(base64Data, 'image/jpeg');
      console.log('blob', await blob.text());

      const imageUrl = await this.supabaseService.uploadImage(blob);

      this.sendFileMessage({
        type: 'image',
        url: imageUrl,
        from: this.currentUserId,
        to: this.contactId,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('❌ Error al tomar o enviar imagen:', JSON.stringify(err));
    }
  }

  async getCurrentLocation() {
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude,
    };
  }

  async sendLocationMessage() {
    const coords = await this.getCurrentLocation();
    if (!coords) return;

    const message = {
      type: 'location',
      from: this.currentUserId,
      lat: coords.lat,
      lng: coords.lng,
      to: this.contactId,
      timestamp: new Date(),
    };

    await this.sendFileMessage(message);
  }
}
