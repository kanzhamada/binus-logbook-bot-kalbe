import { createPartFromUri, createUserContent, GoogleGenAI } from '@google/genai';
import { ActivityData } from '../types/bot.js';
import * as fs from 'fs';
import * as path from 'path';

// Updated flow: GeminiBot now accepts a model name parameter for flexible selection during report generation.
// Data comes from Glide scraping, not Excel.

export class GeminiBot {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-3-flash-preview') {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  // Generates monthly report using selected Gemini model and scraped activity logs from Glide.
  async generateMonthlyReport(activityLogs: ActivityData[], monthName: string): Promise<string> {
    const prompt = this.constructSystemPrompt(activityLogs, monthName);
    
    try {
      const directoryPath = path.join(process.cwd(), 'monthly-report-example');
      const files = fs.readdirSync(directoryPath);
      const pdfFile = files.find(file => file.endsWith('.pdf'));

      if (!pdfFile) {
        throw new Error('No PDF file found in monthly-report-example directory');
      }

      const filePath = path.join(directoryPath, pdfFile);

      const myfile = await this.client.files.upload({
        file: filePath,
        config: {
          mimeType: 'application/pdf'
        }
      })

      if (!myfile.uri || !myfile.mimeType) {
        throw new Error('Failed to upload file: URI or MimeType is undefined');
      }

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: createUserContent([
          createPartFromUri(myfile.uri, myfile.mimeType),
          prompt
        ])
      });
      
      if (response.text) {
        return response.text;
      }
      throw new Error('No text in response');
    } catch (error) {
      console.error('Error generating report with Gemini:', error);
      throw error;
    }
  }

  private constructSystemPrompt(activityLogs: ActivityData[], monthName: string): string {
    const logsString = JSON.stringify(activityLogs, null, 2);
    
    return `
    Pertama-tama bacalah dulu file pdf yang diberikan.
    Anda adalah asisten penulisan laporan magang untuk mahasiswa Computer Science Binus University. Tugas Anda adalah membuat 'Laporan Enrichment Program' bulanan dalam Bahasa Indonesia berdasarkan data log aktivitas yang diberikan.

    Struktur Dokumen yang Harus Dipertahankan:
    1. BAB 1 PENDAHULUAN: Tetap gunakan Profil Perusahaan (PT Kalbe Farma Tbk), Visi, Misi, dan Motto yang sudah ada di referensi.
       - 1.1 Profil Perusahaan
       - 1.2 Posisi Mahasiswa: Sesuai pada referensi file pdf yang diberikan.
    2. BAB 2 LAPORAN KEGIATAN:
       - 2.1 Proses Bisnis: Ringkas aktivitas utama bulan ${monthName} menjadi satu paragraf profesional.
       - 2.2 Kegiatan Sesuai Learning Plan:
         - 2.2.1 Project: Bagi menjadi 'Minggu Pertama' hingga 'Minggu Keempat/Kelima' berdasarkan tanggal pada log.
         - 2.2.2 Technical Competency (TC): Identifikasi teknologi yang digunakan (misal: Supabase, Mirth, Power Automate) dan jelaskan kegunaannya.
         - 2.2.3 EES: Hubungkan aktivitas dengan Binus Graduate Attributes (seperti Self-Management, Collaboration, Problem Solving, Networking, Leadership, Organization, Adaptability, Teamwork, dsb).
       - 2.3 Penuntasan Tugas: Berikan ringkasan per minggu mengenai status penyelesaian tugas.
    3. KESIMPULAN: Buat ringkasan pencapaian bulan tersebut secara profesional.
    4. REFERENSI: Cantumkan tautan dokumentasi teknologi yang relevan, menggunakan APA format (Supabase, HL7 FHIR, dsb.).

    Data Input (Activity Log), jangan pedulikan Approval Progress:
    ${logsString}

    Format Output: Hasil harus dalam format Markdown yang siap dikonversi ke .docx.
    `;
  }
}
