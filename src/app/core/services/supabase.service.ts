import { Injectable } from '@angular/core';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class supabaseService {
  private supabase: SupabaseClient;
  constructor(private firestore: Firestore) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
    );
  }

  base64ToBlob(base64Data: string, contentType = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);

      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  base64ToBlobAudio(base64: string, contentType = 'audio/webm'): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);

      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  async uploadToSupabase(blob: Blob): Promise<string> {
    const fileName = `voice_${Date.now()}.webm`;

    const { data, error } = await this.supabase.storage
      .from('audios')
      .upload(fileName, blob, {
        contentType: 'audio/webm',
      });

    if (error) {
      console.error('Error al subir a Supabase:', error);
      return '';
    }

    const { publicUrl } = this.supabase.storage
      .from('audios')
      .getPublicUrl(fileName).data;
    return publicUrl;
  }

  normalizeFileName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '');
  }

  async uploadFile(file: File, folder: string): Promise<string | null> {
    const fileName = this.normalizeFileName(file.name);
    const filePath = `${folder}/${Date.now()}_${fileName}`;

    const { error } = await this.supabase.storage
      .from('files')
      .upload(filePath, file, { contentType: file.type });

    if (error) {
      console.error('❌ Error al subir archivo:', error.message);
      return null;
    }

    const { data: urlData } = this.supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  }

  async uploadMediaFile(path: string, file: Blob): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('media')
      .upload(path, file, {
        contentType: file.type,
      });

    if (error) throw error;

    return this.supabase.storage.from('media').getPublicUrl(path).data
      .publicUrl;
  }

  async uploadImage(file: Blob, pathPrefix: string = 'chat'): Promise<string> {
    const fileName = `${pathPrefix}/${Date.now()}.jpeg`;

    const { error } = await this.supabase.storage
      .from('images') // Asegúrate de tener el bucket llamado "chat"
      .upload(fileName, file, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = this.supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log(data);
    return data.publicUrl;
  }

  async uploadProfilePhoto(blob: Blob, userId: string): Promise<string> {
    const filePath = `profile_photos/${userId}_${Date.now()}.jpg`;

    const { data, error } = await this.supabase.storage
      .from('profile') // Reemplaza con tu bucket
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from('profile')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }
}
