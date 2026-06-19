import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import 'multer';

@Injectable()
export class GoogleDriveService {
  private drive;

  constructor() {
    // Inicializa a conexão com o Google usando o arquivo JSON
    const auth = new google.auth.GoogleAuth({
      keyFile: 'google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not defined');
    }

    if (!folderId) {
      throw new Error('Atenção: GOOGLE_DRIVE_FOLDER_ID não foi encontrado no arquivo .env!');
    }
    
    // Transforma o buffer do arquivo em um fluxo de leitura (Stream)
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);

    // 1. Envia para o Google Drive
    const response = await this.drive.files.create({
      requestBody: {
        name: `${Date.now()}_${file.originalname}`, // Adiciona um timestamp para evitar nomes duplicados
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: stream,
      },
      fields: 'id, webViewLink', // Pede para o Google devolver o Link
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Google Drive upload did not return a file ID');
    }

    // 2. Altera a permissão para "Qualquer pessoa com o link pode ver"
    // Isso é essencial para o Frontend conseguir exibir o PDF/Imagem depois
    await this.drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const webViewLink = response.data.webViewLink;
    if (!webViewLink) {
      throw new Error('Google Drive upload did not return a webViewLink');
    }

    // Retorna o link público!
    return webViewLink;
  }
}