import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  EstudantesService,
  EstudanteSaude } from '../../../../compartilhado/services/estudantes.service';
import { ModalEspecificidadesComponent } from './modais/restricoes';

@Component({
  selector: 'app-bloco-saude',
  imports: [CommonModule, ModalEspecificidadesComponent],
  templateUrl: './bloco-saude.html',
  styleUrls: ['./bloco-saude.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoSaudeComponent implements OnInit {
  readonly estudanteId = input.required<string>();
  @Output() recolher = new EventEmitter<void>();

  dadosSaude: EstudanteSaude | null = null;
  restricoes: any[] = [];
  especificidadesAlimentares: any[] = [];
  outrasEspecificidades: any[] = [];

  isLoading = false;
  isPreviewOpen = false;
  isModalEspecificidadesOpen = false;
  safePreviewUrl: SafeResourceUrl | null = null;

  private sanitizer = inject(DomSanitizer);
  private estudantesService = inject(EstudantesService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.estudanteId()) {
      this.carregarDadosSaude();
    }
  }

  carregarDadosSaude(): void {
    this.isLoading = true;
    this.estudantesService.getSaude(this.estudanteId()).subscribe({
      next: (dados) => {
        this.dadosSaude = dados;

        this.restricoes = dados.especificidades.filter((e: any) => e.tipo === 'RESTRICAO');

        this.especificidadesAlimentares = this.restricoes.filter(
          (e: any) => e.categoria === 'ALIMENTAR',
        );
        this.outrasEspecificidades = this.restricoes.filter(
          (e: any) => e.categoria !== 'ALIMENTAR',
        );

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {

        this.isLoading = false;
        this.cdr.detectChanges();
      } });
  }

  onRecolher(): void {
    this.recolher.emit();
  }

  adicionarLaudo(): void {

  }

  adicionarMedicamento(): void {

  }

  abrirModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = true;
  }

  fecharModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = false;
  }



  private extrairFileId(driveUrl: string): string | null {
    const idMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return idMatch ? (idMatch[1] ?? null) : null;
  }

  getDownloadUrl(driveUrl: string): string {
    const fileId = this.extrairFileId(driveUrl);
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : driveUrl;
  }

  abrirPreview(driveUrl: string): void {
    const fileId = this.extrairFileId(driveUrl);
    if (fileId) {
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://drive.google.com/file/d/${fileId}/preview`,
      );
      this.isPreviewOpen = true;
    }
  }

  fecharPreview(): void {
    this.isPreviewOpen = false;
  }
}
